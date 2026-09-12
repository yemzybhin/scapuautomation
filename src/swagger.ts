import { Application } from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

export const setupSwagger = (app: Application) => {
  const options = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Science Facts Guru API',
        version: '1.0.0',
        description: 'API documentation for CareSync backend',
      },
      servers: [{ url: 'https://backend-ufx0.onrender.com/v1', description: 'Local server' }],
    },
    apis: ['./src/features/**/*.ts'],
  };

  const specs = swaggerJsdoc(options);

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
};
