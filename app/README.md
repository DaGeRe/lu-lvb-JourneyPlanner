# lu-lvb-JourneyPlanner

## Development Guide
### Styleguide
[Airbnb Javascript Style Guide](https://github.com/airbnb/javascript)

### Dependencies
`Dependency` v`recommended version` (where appropriate) - `purpose` (where appropriate)
- npm v10.9.0
- Node.js v22.12.0

## Hosting
WebApp available at:
[https://jramirezdd.github.io/lu-lvb-JourneyPlanner](https://jramirezdd.github.io/lu-lvb-JourneyPlanner)

## Development Mode vs Production Mode
The application can be ran in 2 modes. Development Mode, and Production Mode.
The functional difference between these 2 modes is exclusively pertains to the hosting for the back-end components, which so far only include proxies (which are needed to inject API-Tokens to the requests without exposing them to the Clients, and to have a CORS-valid request source).
- **In Development Mode**, the back-end components are hosted as React Pages in the local device. No additional set-up is needed, and they will be available by default under `http://localhost:3000/lu-lvb-JourneyPlanner/api/proxy/...`.
- **In Production Mode**, the back-end components are expected to be hosted either separately (splitting UI or Client-Side components (as static pages)), or in a hosting platform that supports dynamic pages (with server-side scripting) such as Vercel.
    - In our case, we decided to split the Front-End and Back-End components as a demonstration of the possibilities of deployment (deploying the application in 2 separate hosting platforms). 
        * __To deploy the application in a single platform, all that is required is to follow a 'next.js' hosting guide.__
    - __Take into account that back-end components can be responsible for routing requests to an API service, posing a security risk of not dealt with cautiously (by implementing CORS, restrictions, spam protection, etc).__


## Environment Variables
### Local Environment Variables
The application expects environment variables. For security reasons, API keys and other secrets are stored under `.env.local` file, which is not available in the GitHub repo, and are loaded alongside the main environment variables file (`.env.development`, `.env.test`, or `.env.production`).
To set this up, do the following:
Create `.env.local` file under `/app/src`
Place the following variables
- `LVB_API_KEY`="YOUR_KEY" => Corresponds to the API Key to the LVB APIs.


### Per-Environment Application Environment Variables
Expected under `.env.development`, `.env.test`, or `.env.production`, depending on your desired environnment.
These environment variables relate to target-API-endpoints, API Proxy Configurations, and triggering alternative application functionality.
- `BUILD_MODE`="`export`"/"`standalone`" => Ideally set as part of the build process as the system's environment variables.
    - `export` => only generates static pages, excluding anything under `/pages/api`.
    - `standalone` => generates the entire ready-to-host application in a single package.
- `NEXT_PUBLIC_LVB_PROXY_ADDRESS`="http://LVB_PROXY_ADDRESS" => When the application is hosted locally and in a single deployment, then simply referring to the the localhost address is sufficient. Otherwise, the address of the externally-hosted proxies needs to be provided.
- `LVB_API_BASE_URL`="http://LVB_API_BASE_URL" => Used by the Proxy Component.
- `NEXT_PUBLIC_API_ENDPOINT_AUTOCOMPLETE`="/lvb-endpoint"
- `NEXT_PUBLIC_API_ENDPOINT_STOPMONITOR`="/lvb-endpoint"
- `NEXT_PUBLIC_API_ENDPOINT_ROUTING`="/lvb-endpoint"
- `NEXT_PUBLIC_API_ENDPOINT_NEARBYSEARCH`="/lvb-endpoint"
- `NEXT_PUBLIC_USE_MOCK`="`true`"/"`false`" => Makes it so that the client does not submit requests through the proxy, and instead returns pre-made objects on request.



## Getting Started

### Running in Development Mode:
1. ***First install the dependencies***
```bash
npm install
```

2. ***Then, run the development server:***
```bash
npm run dev
```


### Running in Production Mode (Separate Hosting of Front-end and Back-end Components):
1. ***First install the dependencies***
```bash
npm install
```

2. ***Build and Start back-end components***
__Don't forget to change the configuration of `.env.production` if required.__
```bash
npm run build:backend # runs custom build script that ignores files under /src, which coincidentally contains all front-end files.
npm run start:backend # simply runs next start, which is intended for server-rendered builds. 
```

3. ***Build and Start front-end components***
__Don't forget to change the configuration of `.env.production` if required.__
```bash
npm run build:frontend  # runs build and export static pages, which ignores api routes.
                        # generates static export under /out
```
Afterwards, serve the frontend, e.g., using nginx:
```bash
docker run -d -p 80:80 \
	--name nginx-container \
	-v $(pwd)/out:/usr/share/nginx/html/lu-lvb-JourneyPlanner:ro nginx
```

### Accessing pages

Base Endpoint of the project is /lu-lvb-JourneyPlanner (ie. access through localhost:3000/lu-lvb-JourneyPlanner)
Base URL must be followed by `/en` or `/de` for the target locale (ie access through `http://localhost:3000/lu-lvb-JourneyPlanner/en/...`)

Current pages are visible at:
- [/](http://localhost:3000/lu-lvb-JourneyPlanner/en/)
- [/controlPanel](http://localhost:3000/lu-lvb-JourneyPlanner/en/controlPanel)
- [/map](http://localhost:3000/lu-lvb-JourneyPlanner/en/map)
- [/examples/contexts/autocomplete](http://localhost:3000/lu-lvb-JourneyPlanner/en/examples/contexts/autocomplete)
- [/examples/contexts/multi-component](http://localhost:3000/lu-lvb-JourneyPlanner/en/examples/contexts/multi-component)
- [/examples/contexts/trigger-function](http://localhost:3000/lu-lvb-JourneyPlanner/en/examples/contexts/trigger-function)

#### Development Pages:
Pages are only accessible when ran in Development or Test mode:

Pre-made Scenarios:
http://localhost:3000/lu-lvb-JourneyPlanner/test/scenarios?scenario=itineraryViewScenario



## Running tests

### Jest Unit Tests
```bash
npx jest    # Run all tests
# or
npx jest path/to/test/file.test.tsx     # Run a specific file
# or
npx jest src/components # Run tests in a folder
# or
npx jest --testNamePattern="ComponentName" # Run tests that match a specific name or folder
# or
npx jest --coverage # To view a detailed coverage report under the /coverage folder.

```

### Playwright Tests

Ensure you have downloaded Playwright
```bash
npx playwright install
```

Available commands:
```bash
npm run test:playwright
# or
npm run test:playwright:headed
# or
npm run test:playwright:ui
```


### ESLint and Prettier
```bash
npm run lint # Runs ESLint formatting checks.
```
