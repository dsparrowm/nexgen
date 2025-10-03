import { Request, Response } from 'express';

export const notFound = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      message: `Route ${req.originalUrl} not found`,
      availableEndpoints: [
        'GET /api - API information',
        'GET /health - Health check',
        'POST /api/auth/user/login - User login',
        'POST /api/auth/admin/login - Admin login',
      ]
    },
    timestamp: new Date().toISOString(),
  });
};