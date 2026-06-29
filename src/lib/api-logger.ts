import { NextResponse } from 'next/server';

type ApiHandler = (request: Request, ...args: any[]) => Promise<Response>;

export function withTiming(handler: ApiHandler, routeName: string): ApiHandler {
  return async (request: Request, ...args: any[]) => {
    const start = performance.now();
    try {
      const response = await handler(request, ...args);
      const duration = (performance.now() - start).toFixed(0);
      
      // The exact format requested by the user: "POST /api/orders 132ms"
      console.log(`${request.method} ${routeName} \n${duration}ms\n`);
      
      // Inject into headers as well for debugging
      if (response instanceof NextResponse) {
        response.headers.set('X-Response-Time', `${duration}ms`);
      }
      return response;
    } catch (error) {
      const duration = (performance.now() - start).toFixed(0);
      console.log(`❌ ERROR ${request.method} ${routeName} \n${duration}ms\n`);
      throw error;
    }
  };
}
