# include ./server/.env
# export $(shell sed 's/=.*//' ./server/.env)

.PHONY: server expo drop-db db shared

# Target to start the server
dev:
	@cd ./server && npm run dev

dist:
	@cd ./server && npm run dist

# Target to start the Expo App
expo:
	@cd ./app && npx expo start --clear

tunnel:
	@cd ./app && npx expo start --clear --tunnel

drop-db:
	@echo "Resetting schema..."
	@cd ./server && . ./.env && PGPASSWORD=$$DB_PASSWORD psql -h $$DB_HOST -p $$DB_PORT -U $$DB_USER -d $$DB_NAME -c "DROP SCHEMA public CASCADE;"
	@cd ./server && . ./.env && PGPASSWORD=$$DB_PASSWORD psql -h $$DB_HOST -p $$DB_PORT -U $$DB_USER -d $$DB_NAME -c "CREATE SCHEMA public;"
	@echo "Schema reset completed ✅"

db:
	@make drop-db
	@echo "Generating new schema..."
	@cd ./server && npx prisma migrate dev --name init --skip-seed
	@echo "Schema generated ✅"
	@echo "Seeding database..."
	@cd ./server && npx prisma db seed
	@echo "Seeding completed ✅"

shared:
	@cd ./shared && npm run build