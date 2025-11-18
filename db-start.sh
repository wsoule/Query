#!/bin/bash

# Quick start script for PostgreSQL development and production databases

set -e

case "$1" in
    start)
        echo "Starting PostgreSQL databases (dev + prod)..."
        docker-compose up -d
        echo ""
        echo "Waiting for databases to be ready..."
        sleep 3

        echo "Checking development database..."
        docker-compose exec -T postgres-dev pg_isready -U queryuser -d querydb_dev || true

        echo "Checking production database..."
        docker-compose exec -T postgres-prod pg_isready -U queryuser -d querydb_prod || true

        echo ""
        echo "Databases are starting up!"
        echo ""
        echo "=== DEVELOPMENT DATABASE ==="
        echo "  Host: localhost"
        echo "  Port: 5432"
        echo "  Database: querydb_dev"
        echo "  Username: queryuser"
        echo "  Password: querypass"
        echo "  Connection: postgresql://queryuser:querypass@localhost:5432/querydb_dev"
        echo ""
        echo "=== PRODUCTION DATABASE ==="
        echo "  Host: localhost"
        echo "  Port: 5433"
        echo "  Database: querydb_prod"
        echo "  Username: queryuser"
        echo "  Password: querypass"
        echo "  Connection: postgresql://queryuser:querypass@localhost:5433/querydb_prod"
        echo ""
        echo "Note: Initialization may take 1-2 minutes (inserting 1M rows per database)"
        echo "Monitor progress: ./db-start.sh logs"
        ;;
    stop)
        echo "Stopping PostgreSQL databases..."
        docker-compose down
        echo "Databases stopped."
        ;;
    restart)
        echo "Restarting PostgreSQL databases..."
        docker-compose restart
        echo "Databases restarted."
        ;;
    reset)
        echo "Resetting databases (removing all data)..."
        docker-compose down -v
        echo "Starting fresh databases..."
        docker-compose up -d
        echo "Databases reset complete. Initialization in progress..."
        ;;
    logs)
        docker-compose logs -f
        ;;
    logs-dev)
        docker-compose logs -f postgres-dev
        ;;
    logs-prod)
        docker-compose logs -f postgres-prod
        ;;
    psql-dev)
        docker-compose exec postgres-dev psql -U queryuser -d querydb_dev
        ;;
    psql-prod)
        docker-compose exec postgres-prod psql -U queryuser -d querydb_prod
        ;;
    status)
        docker-compose ps
        echo ""
        echo "Health checks:"
        docker-compose exec -T postgres-dev pg_isready -U queryuser -d querydb_dev && echo "✓ Development database is ready" || echo "✗ Development database not ready"
        docker-compose exec -T postgres-prod pg_isready -U queryuser -d querydb_prod && echo "✓ Production database is ready" || echo "✗ Production database not ready"
        ;;
    diff)
        echo "Comparing table counts between dev and prod..."
        echo ""
        echo "=== DEVELOPMENT ==="
        docker-compose exec -T postgres-dev psql -U queryuser -d querydb_dev -c "
        SELECT
            schemaname || '.' || tablename as table_name,
            n_live_tup as row_count
        FROM pg_stat_user_tables
        ORDER BY tablename;"

        echo ""
        echo "=== PRODUCTION ==="
        docker-compose exec -T postgres-prod psql -U queryuser -d querydb_prod -c "
        SELECT
            schemaname || '.' || tablename as table_name,
            n_live_tup as row_count
        FROM pg_stat_user_tables
        ORDER BY tablename;"
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|reset|logs|logs-dev|logs-prod|psql-dev|psql-prod|status|diff}"
        echo ""
        echo "Commands:"
        echo "  start      - Start both PostgreSQL containers"
        echo "  stop       - Stop both PostgreSQL containers"
        echo "  restart    - Restart both PostgreSQL containers"
        echo "  reset      - Remove all data and start fresh"
        echo "  logs       - Show logs from both databases"
        echo "  logs-dev   - Show development database logs only"
        echo "  logs-prod  - Show production database logs only"
        echo "  psql-dev   - Connect to development database with psql"
        echo "  psql-prod  - Connect to production database with psql"
        echo "  status     - Show container status and health"
        echo "  diff       - Compare table row counts between dev and prod"
        exit 1
        ;;
esac
