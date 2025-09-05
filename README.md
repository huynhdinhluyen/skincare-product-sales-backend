# SkinShine

A RESTful API built with NestJS and MongoDB for managing and selling skincare products.

## Features

- Product, category, and promotion management  
- Shopping cart and order processing  
- User authentication and authorization (JWT)  
- Skin test questionnaire and result storage  
- Feedback system  
- Dashboard and reporting  
- API documentation with Swagger  
- Input validation, logging, security headers (Helmet), and compression  

## Technology Stack

- Node.js, NestJS (TypeScript)  
- Database: MongoDB, Mongoose  
- Authentication: Passport.js, JWT  
- Swagger (OpenAPI)  
- Validation: class-validator, class-transformer  
- ESLint, Prettier  

## Prerequisites

- Node.js >= 16.x  
- npm >= 8.x  
- MongoDB instance  

## Installation

1. Clone the repository  
   ```bash
   git clone https://github.com/your-org/skincare-product-sales-backend.git
   cd skincare-product-sales-backend
   ```

2. Install dependencies  
   ```bash
   npm install
   ```

3. Create a `.env` file in the project root (see `.env.example`)  
   ```dotenv
   MONGO_URI=mongodb://localhost:27017/skincare_db
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRES_IN=3600s
   PORT=3000
   ```

## Running the Application

- Development (watch mode)  
  ```bash
  npm run start:dev
  ```

- Production  
  ```bash
  npm run build
  npm run start:prod
  ```

The API server will be available at `http://localhost:3000/api/v1`.

## API Documentation

After starting the server, access Swagger UI at:

```
http://localhost:3000/api/v1
```

## Testing

- Unit tests  
  ```bash
  npm run test
  ```

- End-to-end tests  
  ```bash
  npm run test:e2e
  ```

- Coverage report  
  ```bash
  npm run test:cov
  ```

## Project Structure

```
src/
├── auth/               # Authentication and user management
├── product/            # Product CRUD operations
├── category/           # Product categories
├── promotion/          # Promotions and discounts
├── cart/               # Shopping cart logic
├── order/              # Order processing
├── transaction/        # Payment handling
├── skin-test-result/   # Skin test questionnaire & results
├── questions/          # Questions for skin tests
├── feedback/           # User feedback
├── dashboard/          # Reporting and analytics
└── common/             # Shared modules, pipes, filters, interceptors
```

## Contributing

1. Fork the repository  
2. Create a feature branch (`git checkout -b feature/your-feature`)  
3. Commit your changes (`git commit -m 'feat: add your feature'`)  
4. Push to the branch (`git push origin feature/your-feature`)  
5. Open a Pull Request  

## License

MIT © 2025 SkinShine
