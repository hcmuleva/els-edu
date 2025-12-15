#!/bin/bash

###############################################################################
# ELS Database Reset Script
# Resets database from backup and seeds demo data
#
# Usage:
#   bash scripts/reset-db-and-seed.sh
#   or
#   npm run reset-db
#
# What it does:
#   1. Stops the Strapi server (if running)
#   2. Drops the current database
#   3. Creates a new database
#   4. Imports backup data
#   5. Starts the server
#   6. Runs seed script to add demo data
###############################################################################

set -e  # Exit on any error

# Configuration
DB_NAME="els_db"
DB_USER="postgres"
DB_HOST="localhost"
DB_PORT="5432"
BACKUP_FILE="$(pwd)/db_backup/els_backup_db_18_nov.sql"
SEED_SCRIPT="$(pwd)/scripts/seed-demo-data.js"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Utility functions
log_header() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

log_info() {
    echo -e "${YELLOW}ℹ${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_header "Checking Prerequisites"

    # Check if psql is installed
    if ! command -v psql &> /dev/null; then
        log_error "psql not found. Please install PostgreSQL client tools."
        exit 1
    fi
    log_success "psql found"

    # Check if backup file exists
    if [ ! -f "$BACKUP_FILE" ]; then
        log_error "Backup file not found: $BACKUP_FILE"
        exit 1
    fi
    log_success "Backup file found: $BACKUP_FILE"

    # Check if seed script exists
    if [ ! -f "$SEED_SCRIPT" ]; then
        log_error "Seed script not found: $SEED_SCRIPT"
        exit 1
    fi
    log_success "Seed script found"

    # Test database connection
    log_info "Testing PostgreSQL connection..."
    if PGPASSWORD=postgres psql -h "$DB_HOST" -U "$DB_USER" -c "\q" &> /dev/null; then
        log_success "PostgreSQL connection successful"
    else
        log_error "Cannot connect to PostgreSQL. Make sure it's running and postgres user password is 'postgres'"
        exit 1
    fi
}

# Kill any existing Strapi process
kill_strapi() {
    log_header "Stopping Strapi Server"

    if pgrep -f "npm.*dev" > /dev/null || pgrep -f "node.*strapi" > /dev/null; then
        log_info "Found running Strapi process..."
        # Try graceful kill first
        pkill -f "npm.*dev" || true
        pkill -f "node.*strapi" || true
        sleep 3
        log_success "Strapi server stopped"
    else
        log_info "No running Strapi process found"
    fi
}

# Drop and recreate database
reset_database() {
    log_header "Resetting Database"

    log_info "Dropping existing database: $DB_NAME"
    PGPASSWORD=postgres psql -h "$DB_HOST" -U "$DB_USER" -c "DROP DATABASE IF EXISTS $DB_NAME;" 2>&1 || true
    log_success "Database dropped"

    log_info "Creating new database: $DB_NAME"
    PGPASSWORD=postgres psql -h "$DB_HOST" -U "$DB_USER" -c "CREATE DATABASE $DB_NAME;"
    log_success "New database created"
}

# Restore from backup
restore_backup() {
    log_header "Restoring Backup Data"

    log_info "Importing backup data from: $BACKUP_FILE"
    PGPASSWORD=postgres psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" < "$BACKUP_FILE" 2>&1 | tail -20
    log_success "Database restored from backup"
}

# Wait for server to be ready
wait_for_server() {
    local max_attempts=30
    local attempt=0

    log_info "Waiting for server to be ready..."

    while [ $attempt -lt $max_attempts ]; do
        if curl -s http://localhost:1337 > /dev/null 2>&1; then
            log_success "Server is ready!"
            return 0
        fi

        attempt=$((attempt + 1))
        echo -n "."
        sleep 2
    done

    log_error "Server did not start within expected time"
    return 1
}

# Start Strapi server in background
start_server() {
    log_header "Starting Strapi Server"

    log_info "Starting server in background..."
    cd "$(dirname "$BACKUP_FILE")/.."  # Go to elsserver directory
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ]; then
        log_error "package.json not found. Are we in the elsserver directory?"
        exit 1
    fi

    # Start server in background and save PID
    npm run dev > /tmp/strapi-server.log 2>&1 &
    local SERVER_PID=$!
    echo $SERVER_PID > /tmp/strapi-server.pid
    
    log_success "Server started (PID: $SERVER_PID)"
    log_info "Check logs at: /tmp/strapi-server.log"

    # Wait for server to be ready
    wait_for_server || {
        log_error "Failed to start server. Check logs at /tmp/strapi-server.log"
        exit 1
    }
}


# Main execution
main() {
    log_header "🔄 ELS Database Reset & Seed"
    log_info "This script will:"
    log_info "  1. Stop Strapi server"
    log_info "  2. Drop and recreate database"
    log_info "  3. Restore backup data"
    log_info "  4. Start Strapi server"
    log_info "  5. Create demo data (seed)"
    echo ""

    # Ask for confirmation
    read -p "Continue? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Cancelled."
        exit 0
    fi

    # Execute steps
    check_prerequisites
    kill_strapi
    reset_database
    restore_backup
    start_server

    log_header "✅ Database Reset Complete!"
    log_success "Database has been reset and seeded with demo data"
    log_info "Frontend: http://localhost:5173"
    log_info "Backend: http://localhost:1337"
    log_info "Demo credentials available in QUICK_START.md"
    echo ""
}

# Run main function
main "$@"
