# Models README

This directory contains the data models used in the commuter-app API. Models define the structure of data stored and processed by the application.

## Purpose

Models are used to:
- Represent entities such as users, commutes, routes, and schedules.
- Define relationships between different entities.
- Validate and serialize data for API endpoints.

## Common Models

- **User**: Stores user information and authentication details.
- **Commute**: Represents a user's commute, including origin, destination, and time.
- **Route**: Details possible routes for a commute.
- **Schedule**: Contains timing information for commutes and routes.

## Usage

Models are typically defined using an ORM (e.g., Sequelize, TypeORM, Mongoose). They are imported into controllers and services to interact with the database.

## Adding a Model

1. Create a new file in the `models` directory.
2. Define the schema and validation rules.
3. Export the model for use in other parts of the application.

