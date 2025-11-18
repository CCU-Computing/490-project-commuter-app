commuter-app
Short README covering the API, frontend, PostGIS database setup, usage, project structure, and Docker setup.
Project overview
Commuter App is a complete full-stack mapping and analytics platform containing:
•	REST API backend (Node.js + Express)
•	Web frontend (PHP/Apache)
•	Relational + geospatial database (PostgreSQL + PostGIS)
•	GeoJSON-based bus routes and stops
•	Parking lot fulfillment submission + historical tracking
•	Faculty tools for creating/editing routes and stops via Leaflet
This README explains how to set up the backend, web UI, and database locally. It also describes environment variables, endpoints, and the recommended Docker workflow.
________________________________________
Repository layout
(Adjusted to your real project)
commuter-app/
│
├── apps/
│   ├── api/                 # Node.js backend (controllers, routes)
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── server.js
│   │   ├── db.js
│   │   └── Dockerfile
│   │
│   └── web/                 # PHP frontend (Apache-served)
│       ├── index.php
│       ├── parking.php
│       ├── mod-routes.php
│       ├── mod-stops.php
│       └── assets/
│
├── infrastructure/
│   └── init/                # Auto-loaded on DB start
│       ├── parkinglotSchema.sql
│       ├── parkinglotSeed.sql
│       ├── busRoutesSchema.sql
│       ├── busStopsSchema.sql
│       └── seedBusRoutes.geojson
│
├── docker-compose.yml
├── .env.example
└── README.md
________________________________________
Requirements
You can run the project with or without Docker.
Without Docker:
•	Node.js 18+
•	npm or yarn
•	PHP 8+ (built-in server or Apache)
•	PostgreSQL 15+
•	PostGIS extension installed
With Docker (recommended):
•	Docker
•	docker-compose
________________________________________
Environment variables
Create .env inside apps/api/.
Backend .env:
PGHOST=db
PGUSER=postgres
PGPASSWORD=postgres
PGDATABASE=transit
PGPORT=5432

PORT=3000
NODE_ENV=development
Frontend generally does not require env vars — it only points to API via absolute paths like /api/....
________________________________________
Database
PostgreSQL + PostGIS is required.
1. Create the database (for manual setup)
createdb transit
2. Enable PostGIS
Inside psql:
CREATE EXTENSION postgis;
3. Run migrations (schema creation)
psql -d transit -f infrastructure/init/parkinglotSchema.sql
psql -d transit -f infrastructure/init/busRoutesSchema.sql
psql -d transit -f infrastructure/init/busStopsSchema.sql
4. Run seeds
psql -d transit -f infrastructure/init/parkinglotSeed.sql
# optional: seed bus routes/stops depending on your SQL setup
Schema overview
parking_lots
id UUID pk
name TEXT
capacity INTEGER
geom GEOMETRY(POLYGON, 4326)
parking_lot_fulfillment
id SERIAL pk
parking_lot_id UUID fk
fulfillment INTEGER
special_event BOOLEAN
timestamp TIMESTAMP DEFAULT NOW()
bus_routes
id UUID pk
name TEXT
geom GEOMETRY(MULTILINESTRING, 4326)
bus_stops
id UUID pk
name TEXT
geom GEOMETRY(POINT, 4326)
________________________________________
API (backend)
Backend: Node.js + Express
Located in: /apps/api
Install & run
cd apps/api
npm install
npm run dev
Start in production mode:
npm start
Structure
/api
 ├── controllers     # business logic
 ├── routes          # express route modules
 ├── db.js           # Postgres pool + helpers
 └── server.js       # entry point
________________________________________
API endpoints
Parking lots
GET    /api/lots
GET    /api/lots/:id
POST   /api/lots
PUT    /api/lots/:id
DELETE /api/lots/:id
Fulfillment
GET    /api/fulfillment
POST   /api/fulfillment
Body:
{
  "parking_lot_id": "uuid",
  "fulfillment": 72,
  "special_event": false
}
Bus routes (GeoJSON)
GET    /api/routes
POST   /api/routes
PUT    /api/routes/:id
DELETE /api/routes/:id
Bus stops (GeoJSON)
GET    /api/stops
POST   /api/stops
PUT    /api/stops/:id
DELETE /api/stops/:id
________________________________________
Frontend (PHP web UI)
Located in /apps/web.
Served by Apache when running via Docker.
Local dev (optional):
cd apps/web
php -S localhost:8080
Includes:
•	submission form for parking fulfillment
•	Leaflet map for drawing/editing bus routes
•	CRUD editor for bus stops
•	Fetches data from /api/... endpoints
________________________________________
Docker (recommended workflow)
docker-compose file (included)
Services:
•	db → PostgreSQL + PostGIS
•	api → Node backend
•	web → PHP/Apache frontend
Run entire stack
docker compose up --build
Access:
Service	URL
Web (PHP)	http://localhost:8080
API	http://localhost:3000

DB	localhost:5432
Rebuild backend only
docker compose up --build api
Reset DB entirely
docker compose down -v
This re-runs all SQL in /infrastructure/init/ on next startup.
________________________________________
Deployment notes
•	Backend can be deployed to any Node host (Docker recommended).
•	Frontend (PHP) deploys to any Apache/PHP hosting.
•	DB should use a managed Postgres instance with PostGIS enabled.
Environment variables must be set for API to connect to the database.
________________________________________
Troubleshooting
API cannot connect:
•	Check PGHOST and PGUSER
•	Ensure DB container is running
•	Confirm PostGIS is installed
Leaflet map not loading routes/stops:
•	Verify API returns valid GeoJSON
•	Confirm correct CORS settings if hosting separately
•	Check browser console for fetch errors
Docker DB resets unintentionally:
•	Ensure you did not run:
•	docker compose down -v
which deletes volume
________________________________________
Contributing
•	Fork the repo
•	Create a feature branch
•	Commit with clear messages
•	Open a pull request
________________________________________
License
MIT or specify school/academic license if needed.

