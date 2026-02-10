import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { coFetch } from '@console/internal/co-fetch';
import { FetchProgressModal, FetchProgressModalProps } from '../FetchProgressModal';

jest.mock('@console/internal/co-fetch', () => ({
  coFetch: jest.fn(),
}));

const coFetchMock = coFetch as jest.Mock;

jest.mock('@console/internal/components/utils/units', () => ({
  units: {
    humanize: jest.fn(() => ({ string: '0 B', unit: 'B', value: 0 })),
  },
}));

const createMockReader = (chunks: Uint8Array[] = [new Uint8Array([1, 2, 3])]) => {
  const readMock = jest.fn();
  chunks.forEach((chunk) => {
    readMock.mockResolvedValueOnce({ done: false, value: chunk });
  });
  readMock.mockResolvedValueOnce({ done: true, value: undefined });
  return {
    read: readMock,
    releaseLock: jest.fn(),
  };
};

const defaultProps: FetchProgressModalProps = {
  url: 'https://example.com/data',
  title: 'Download Data',
  downloadingText: 'Downloading data...',
  downloadedText: 'Download complete!',
  downloadFailedText: 'Download failed.',
  isDownloading: false,
  setIsDownloading: jest.fn(),
  callback: jest.fn(),
};

describe('FetchProgressModal', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should call coFetch when isDownloading is true', async () => {
    const setIsDownloading = jest.fn();
    const mockReader = createMockReader();
    coFetchMock.mockResolvedValue({
      body: { getReader: () => mockReader },
    });

    render(
      <FetchProgressModal {...defaultProps} isDownloading setIsDownloading={setIsDownloading} />,
    );

    await waitFor(() => {
      expect(coFetch).toHaveBeenCalledWith(
        'https://example.com/data',
        expect.objectContaining({ signal: expect.any(AbortSignal) }),
      );
    });
  });

  it('should show downloadingText when fetch is running', () => {
    coFetchMock.mockReturnValue(new Promise(() => {}));

    render(<FetchProgressModal {...defaultProps} isDownloading />);

    expect(screen.getByText('Downloading data...')).toBeVisible();
  });

  it('should show downloadedText when fetch is finished', async () => {
    const setIsDownloading = jest.fn();
    const mockCallback = jest.fn();
    const mockReader = createMockReader();
    coFetchMock.mockResolvedValue({
      body: { getReader: () => mockReader },
    });

    const { rerender } = render(
      <FetchProgressModal
        {...defaultProps}
        isDownloading
        setIsDownloading={setIsDownloading}
        callback={mockCallback}
      />,
    );

    await waitFor(() => {
      expect(setIsDownloading).toHaveBeenCalledWith(false);
    });

    rerender(
      <FetchProgressModal
        {...defaultProps}
        isDownloading={false}
        setIsDownloading={setIsDownloading}
        callback={mockCallback}
      />,
    );

    expect(screen.getByText('Download complete!')).toBeVisible();
  });

  it('should show downloadFailedText when download fails due to connection error', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const setIsDownloading = jest.fn();
    coFetchMock.mockRejectedValue(new Error('Network error'));

    const { rerender } = render(
      <FetchProgressModal {...defaultProps} isDownloading setIsDownloading={setIsDownloading} />,
    );

    await waitFor(() => {
      expect(setIsDownloading).toHaveBeenCalledWith(false);
    });

    rerender(
      <FetchProgressModal
        {...defaultProps}
        isDownloading={false}
        setIsDownloading={setIsDownloading}
      />,
    );

    expect(screen.getByText('Download failed.')).toBeVisible();
    expect(screen.getByText('Network error')).toBeVisible();
  });

  it('should show downloadFailedText when download fails due to unknown error', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const setIsDownloading = jest.fn();
    coFetchMock.mockRejectedValue(new Error());

    const { rerender } = render(
      <FetchProgressModal {...defaultProps} isDownloading setIsDownloading={setIsDownloading} />,
    );

    await waitFor(() => {
      expect(setIsDownloading).toHaveBeenCalledWith(false);
    });

    rerender(
      <FetchProgressModal
        {...defaultProps}
        isDownloading={false}
        setIsDownloading={setIsDownloading}
      />,
    );

    expect(screen.getByText('Download failed.')).toBeVisible();
    expect(screen.getByText('Could not fetch data')).toBeVisible();
  });

  it('should show downloadFailedText when download is cancelled', async () => {
    const setIsDownloading = jest.fn();
    coFetchMock.mockImplementation(
      (_url: string, options: { signal: AbortSignal }) =>
        new Promise((_resolve, reject) => {
          options.signal.addEventListener('abort', () => {
            reject(new DOMException('The operation was aborted', 'AbortError'));
          });
        }),
    );

    const { rerender } = render(
      <FetchProgressModal {...defaultProps} isDownloading setIsDownloading={setIsDownloading} />,
    );

    fireEvent.click(screen.getByTestId('fetch-progress-modal-cancel'));

    await waitFor(() => {
      expect(setIsDownloading).toHaveBeenCalledWith(false);
    });

    rerender(
      <FetchProgressModal
        {...defaultProps}
        isDownloading={false}
        setIsDownloading={setIsDownloading}
      />,
    );

    expect(screen.getByText('Download failed.')).toBeVisible();
    expect(screen.getByText('Download canceled')).toBeVisible();
  });

  it('should show Close button only when download is failed or complete', async () => {
    const setIsDownloading = jest.fn();
    const mockReader = createMockReader();
    coFetchMock.mockResolvedValue({
      body: { getReader: () => mockReader },
    });

    const { rerender } = render(
      <FetchProgressModal {...defaultProps} isDownloading setIsDownloading={setIsDownloading} />,
    );

    // During download: Cancel button visible, no Close button
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument();
    expect(screen.getByTestId('fetch-progress-modal-cancel')).toHaveTextContent('Cancel');

    await waitFor(() => {
      expect(setIsDownloading).toHaveBeenCalledWith(false);
    });

    rerender(
      <FetchProgressModal
        {...defaultProps}
        isDownloading={false}
        setIsDownloading={setIsDownloading}
      />,
    );

    // After completion: Close button visible, Cancel button gone
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
    expect(screen.getByTestId('fetch-progress-modal-cancel')).toHaveTextContent('Close');
  });

  it('should abort the fetch when Cancel button is clicked', () => {
    const abortSpy = jest.spyOn(AbortController.prototype, 'abort');
    const setIsDownloading = jest.fn();
    coFetchMock.mockReturnValue(new Promise(() => {}));

    render(
      <FetchProgressModal {...defaultProps} isDownloading setIsDownloading={setIsDownloading} />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(abortSpy).toHaveBeenCalled();
    expect(setIsDownloading).toHaveBeenCalledWith(false);
  });

  it('should close the modal when PF modal close button is clicked', async () => {
    const setIsDownloading = jest.fn();
    const mockReader = createMockReader();
    coFetchMock.mockResolvedValue({
      body: { getReader: () => mockReader },
    });

    const { rerender } = render(
      <FetchProgressModal {...defaultProps} isDownloading setIsDownloading={setIsDownloading} />,
    );

    await waitFor(() => {
      expect(setIsDownloading).toHaveBeenCalledWith(false);
    });

    rerender(
      <FetchProgressModal
        {...defaultProps}
        isDownloading={false}
        setIsDownloading={setIsDownloading}
      />,
    );

    fireEvent.click(screen.getByLabelText('Close'));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
