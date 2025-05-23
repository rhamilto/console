@add-flow @dev-console
Feature: Create Application from Database
              As a user, I want to create the application, component or service from Database using Add Flow

        Background:
            Given user is at developer perspective
              And user has created or selected namespace "aut-addflow-database"


        @smoke
        Scenario: Create the Database from Add page: A-03-TC01
            Given user is at Add page
             When user clicks Database card
              And user selects "MariaDB" database on Software Catalog
              And user clicks Instantiate Template button on side bar
              And user clicks create button on Instantiate Template page
             Then user will be redirected to Topology page
              And user is able to see workload "mariadb" in topology page
