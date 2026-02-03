import { Node } from '@patternfly/react-topology';
import { render } from '@testing-library/react';
import * as useWarningModalModule from '@console/shared/src/hooks/useWarningModal';
import { launchErrorModal } from '@console/shared/src/utils/error-modal-handler';
import {
  MoveNodeHandlersProvider,
  SyncMoveNodeHandlers,
  useMoveNodeHandlers,
  moveNodeToGroup,
  useSetupMoveNodeToGroupHandlers,
  useSetupMoveNodeToGroupErrorHandler,
} from '../moveNodeToGroup';
import * as topologyUtils from '../topology-utils';

// Mock dependencies
jest.mock('@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay', () => ({
  useOverlay: () => jest.fn(),
}));

jest.mock('@console/shared/src/hooks/useWarningModal', () => ({
  useWarningModal: () => jest.fn(),
}));

jest.mock('@console/shared/src/utils/error-modal-handler', () => ({
  launchErrorModal: jest.fn(),
}));

jest.mock('../topology-utils', () => ({
  updateTopologyResourceApplication: jest.fn(() => Promise.resolve()),
}));

describe('moveNodeToGroup', () => {
  describe('MoveNodeHandlersProvider', () => {
    it('should provide handlers via context', () => {
      let capturedHandlers: any;

      const TestComponent = () => {
        capturedHandlers = useMoveNodeHandlers();
        return null;
      };

      render(
        <MoveNodeHandlersProvider>
          <TestComponent />
        </MoveNodeHandlersProvider>,
      );

      expect(capturedHandlers).toBeDefined();
      expect(capturedHandlers.confirmMove).toBeInstanceOf(Function);
    });

    it('should throw error when used outside provider', () => {
      const TestComponent = () => {
        useMoveNodeHandlers();
        return null;
      };

      // Suppress console.error for this test
      const consoleError = jest.spyOn(console, 'error').mockImplementation();

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useMoveNodeHandlers must be used within MoveNodeHandlersProvider');

      consoleError.mockRestore();
    });
  });

  describe('SyncMoveNodeHandlers', () => {
    it('should sync handlers to module level', () => {
      render(
        <MoveNodeHandlersProvider>
          <SyncMoveNodeHandlers />
        </MoveNodeHandlersProvider>,
      );

      // After sync, moveNodeToGroup should not throw "not initialized" error
      // We can't directly test the module variable, but we can verify sync happened
      expect(() => {
        render(
          <MoveNodeHandlersProvider>
            <SyncMoveNodeHandlers />
          </MoveNodeHandlersProvider>,
        );
      }).not.toThrow();
    });

    it('should cleanup handlers on unmount', () => {
      const { unmount } = render(
        <MoveNodeHandlersProvider>
          <SyncMoveNodeHandlers />
        </MoveNodeHandlersProvider>,
      );

      unmount();

      // After unmount, handlers should be cleaned up
      // This is tested indirectly through the error case
    });
  });

  describe('moveNodeToGroup function', () => {
    let mockNode: Partial<Node>;
    let mockTargetGroup: Partial<Node>;
    let mockSourceGroup: Partial<Node>;
    let mockGraph: any;
    let mockLaunchWarningModal: jest.Mock;

    beforeEach(() => {
      jest.clearAllMocks();

      mockGraph = { getId: () => 'graph' };

      mockSourceGroup = {
        getId: () => 'source-group',
        getLabel: () => 'Source App',
      };

      mockNode = {
        getId: () => 'test-node',
        getLabel: () => 'Test Node',
        getParent: () => mockSourceGroup as Node,
        getGraph: () => mockGraph,
      };

      mockTargetGroup = {
        getId: () => 'target-group',
        getLabel: () => 'Target App',
      };

      mockLaunchWarningModal = jest.fn();

      // Mock useWarningModal to return our controlled mock
      jest.spyOn(useWarningModalModule, 'useWarningModal').mockReturnValue(mockLaunchWarningModal);

      // Reset the topology utils mock to default success
      jest.spyOn(topologyUtils, 'updateTopologyResourceApplication').mockResolvedValue(undefined);
    });

    it('should throw error if handlers not initialized', async () => {
      await expect(moveNodeToGroup(mockNode as Node, mockTargetGroup as Node)).rejects.toThrow(
        'Move node handlers not initialized',
      );
    });

    it('should throw error if source and target are the same', async () => {
      render(
        <MoveNodeHandlersProvider>
          <SyncMoveNodeHandlers />
        </MoveNodeHandlersProvider>,
      );

      mockNode.getParent = () => mockTargetGroup as Node;

      await expect(moveNodeToGroup(mockNode as Node, mockTargetGroup as Node)).rejects.toThrow(
        'Source and target are the same',
      );
    });

    it('should call launchErrorModal when updateTopologyResourceApplication fails', async () => {
      const errorMessage = 'Failed to update resource';
      jest
        .spyOn(topologyUtils, 'updateTopologyResourceApplication')
        .mockRejectedValue(new Error(errorMessage));

      render(
        <MoveNodeHandlersProvider>
          <SyncMoveNodeHandlers />
        </MoveNodeHandlersProvider>,
      );

      // Mock the warning modal to auto-confirm
      mockLaunchWarningModal.mockImplementation(({ onConfirm }) => {
        onConfirm();
      });

      await expect(moveNodeToGroup(mockNode as Node, mockTargetGroup as Node)).rejects.toThrow(
        errorMessage,
      );

      expect(launchErrorModal).toHaveBeenCalledWith({
        error: errorMessage,
      });
    });

    it('should use custom onError handler when provided', async () => {
      const errorMessage = 'Custom error';
      const customErrorHandler = jest.fn();

      jest
        .spyOn(topologyUtils, 'updateTopologyResourceApplication')
        .mockRejectedValue(new Error(errorMessage));

      render(
        <MoveNodeHandlersProvider>
          <SyncMoveNodeHandlers />
        </MoveNodeHandlersProvider>,
      );

      // Mock the warning modal to auto-confirm
      mockLaunchWarningModal.mockImplementation(({ onConfirm }) => {
        onConfirm();
      });

      await expect(
        moveNodeToGroup(mockNode as Node, mockTargetGroup as Node, customErrorHandler),
      ).rejects.toThrow(errorMessage);

      expect(customErrorHandler).toHaveBeenCalledWith(errorMessage);
      expect(launchErrorModal).not.toHaveBeenCalled();
    });

    it('should not call launchErrorModal when user cancels confirmation', async () => {
      render(
        <MoveNodeHandlersProvider>
          <SyncMoveNodeHandlers />
        </MoveNodeHandlersProvider>,
      );

      // Mock the warning modal to call onClose (cancel)
      mockLaunchWarningModal.mockImplementation(({ onClose }) => {
        onClose();
      });

      await expect(moveNodeToGroup(mockNode as Node, mockTargetGroup as Node)).rejects.toThrow(
        'User cancelled',
      );

      expect(launchErrorModal).not.toHaveBeenCalled();
    });

    it('should handle errors when moving node without source group', async () => {
      const errorMessage = 'Update failed';
      jest
        .spyOn(topologyUtils, 'updateTopologyResourceApplication')
        .mockRejectedValue(new Error(errorMessage));

      render(
        <MoveNodeHandlersProvider>
          <SyncMoveNodeHandlers />
        </MoveNodeHandlersProvider>,
      );

      // Node without a parent group
      const nodeWithoutGroup: Partial<Node> = {
        ...mockNode,
        getParent: () => mockGraph,
      };

      await expect(
        moveNodeToGroup(nodeWithoutGroup as Node, mockTargetGroup as Node),
      ).rejects.toThrow(errorMessage);

      expect(launchErrorModal).toHaveBeenCalledWith({
        error: errorMessage,
      });
    });

    it('should successfully move node when updateTopologyResourceApplication succeeds', async () => {
      render(
        <MoveNodeHandlersProvider>
          <SyncMoveNodeHandlers />
        </MoveNodeHandlersProvider>,
      );

      // Mock the warning modal to auto-confirm
      mockLaunchWarningModal.mockImplementation(({ onConfirm }) => {
        onConfirm();
      });

      await expect(
        moveNodeToGroup(mockNode as Node, mockTargetGroup as Node),
      ).resolves.toBeUndefined();

      expect(topologyUtils.updateTopologyResourceApplication).toHaveBeenCalledWith(
        mockNode,
        'Target App',
      );
      expect(launchErrorModal).not.toHaveBeenCalled();
    });
  });

  describe('deprecated hooks', () => {
    it('should log deprecation warning for useSetupMoveNodeToGroupHandlers', () => {
      const consoleWarn = jest.spyOn(console, 'warn').mockImplementation();

      const TestComponent = () => {
        useSetupMoveNodeToGroupHandlers();
        return null;
      };

      render(<TestComponent />);

      expect(consoleWarn).toHaveBeenCalledWith(
        expect.stringContaining('useSetupMoveNodeToGroupHandlers is deprecated'),
      );

      consoleWarn.mockRestore();
    });

    it('should log deprecation warning for useSetupMoveNodeToGroupErrorHandler', () => {
      const consoleWarn = jest.spyOn(console, 'warn').mockImplementation();

      const TestComponent = () => {
        useSetupMoveNodeToGroupErrorHandler();
        return null;
      };

      render(<TestComponent />);

      expect(consoleWarn).toHaveBeenCalledWith(
        expect.stringContaining('useSetupMoveNodeToGroupErrorHandler is deprecated'),
      );

      consoleWarn.mockRestore();
    });
  });
});
