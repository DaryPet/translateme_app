# Front-End Meduzzen Project

This project is aplication built with **Next.js**, styled with **Material UI**, and containerized using **Docker** for development and production. The app is designed to run seamlessly inside Docker containers for efficient local development and deployment.

## Requirements

Before you begin, ensure you have the following installed on your machine:

- **Node.js** (JavaScript runtime)
- **npm** (Node package manager)
- **Material UI** (React UI framework)
- **dotenv** (for managing environment variables)

## Install dependencies:

Run the following command to install all the necessary dependencies:
`npm install`

Start the development server:
`npm run dev`

## To run with Docker Compose:

To build docker compose:
`docker compose build`

To run docker container:
`docker compose up`

To stop docker compose:
`docker compose down`

To see if conatiner is runing:
`docker ps`

For logs:
`docker compose logs`

To check running containers
`docker ps`
To install inside container run
`docker exec -it < container id> sh` `docker exec -it 21e340620192 sh`

To run ESLint
`npm run lint`

## Internationalization (i18n) - Translation

Project supports multiple languages via `next-intl`, translations are stored in `messages` as JSON files. Add new translations or modify existing ones directly in these files. Use `useTranslations` hook in components to access them.
