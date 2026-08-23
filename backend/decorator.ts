import "reflect-metadata";

export interface RouteDefinition {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  methodName: string;
  authLevel: number;
  params?: string[];  // e.g., ['id'] for path '/users/:id'
}

export type RouteHandler = (req: Request, params?: Record<string, string>) => Response | Promise<Response>;

export interface ControllerInstance {
  [methodName: string]: RouteHandler;
}

export type ControllerClass<TInstance extends ControllerInstance = ControllerInstance> = new () => TInstance;

// Utility to extract path parameters
export function extractPathParams(pattern: string, actualPath: string): Record<string, string> | null {
  const patternRegex = pathToRegex(pattern);
  const match = actualPath.match(patternRegex.regex);
  if (!match) return null;
  
  const params: Record<string, string> = {};
  patternRegex.params.forEach((param, index) => {
    params[param] = match[index + 1];
  });
  return params;
}

// Convert path pattern like '/users/:id' to regex
function pathToRegex(pattern: string): { regex: RegExp; params: string[] } {
  const params: string[] = [];
  const regexPattern = pattern
    .replace(/\//g, '\\/')
    .replace(/:(\w+)/g, (_, paramName) => {
      params.push(paramName);
      return '([^\\/]+)';
    });
  return {
    regex: new RegExp(`^${regexPattern}$`),
    params
  };
}

// Extract parameter names from path like '/users/:id/posts/:postId' -> ['id', 'postId']
function extractParamNames(path: string): string[] {
  const matches = path.match(/:(\w+)/g);
  return matches ? matches.map(m => m.slice(1)) : [];
}

// Controller Class Decorator
export function Controller<Base extends ControllerInstance = ControllerInstance>(basePath: string) {
  return <T extends new (...args: unknown[]) => unknown>(target: T): T & (new (...args: unknown[]) => InstanceType<T> & Base) => {
    Reflect.defineMetadata("basePath", basePath, target);
    
    // Gather all routes from class prototype methods
    const proto = target.prototype;
    const routes: RouteDefinition[] = [];
    
    if (proto) {
      const propertyNames = Object.getOwnPropertyNames(proto);
      for (const key of propertyNames) {
        if (key === 'constructor') continue;
        const descriptor = Object.getOwnPropertyDescriptor(proto, key);
        if (descriptor && typeof descriptor.value === 'function') {
          const methodFn = descriptor.value;
          const routeMeta = Reflect.getMetadata("route", methodFn) as { path: string; method: RouteDefinition['method']; authLevel: number; params?: string[] } | undefined;
          if (routeMeta) {
            routes.push({
              path: routeMeta.path,
              method: routeMeta.method,
              methodName: key,
              authLevel: routeMeta.authLevel,
              params: routeMeta.params,
            });
          }
        }
      }
    }
    
    Reflect.defineMetadata("routes", routes, target);
    return target as unknown as T & (new (...args: unknown[]) => InstanceType<T> & Base);
  };
}

// Helper factory for HTTP methods
function createRouteDecorator(method: RouteDefinition['method']) {
  return (path: string, authLevel: number = 0): MethodDecorator => {
    return (target: Object, propertyKey?: string | symbol, descriptor?: PropertyDescriptor) => {
      // In TC39 standard decorators, target is the method function itself.
      // In legacy experimental decorators, target is the class prototype, and descriptor.value is the method function.
      let methodFn: any = target;
      if (descriptor && descriptor.value) {
        methodFn = descriptor.value;
      } else if (typeof target !== 'function' && propertyKey && descriptor === undefined) {
        // Fallback for some legacy environments
        const proto = target as any;
        methodFn = proto[propertyKey];
      }

      if (methodFn && typeof methodFn === 'function') {
        const params = extractParamNames(path);
        Reflect.defineMetadata("route", { path, method, authLevel, params }, methodFn);
      }
    };
  };
}

export const Get = createRouteDecorator('GET');
export const Post = createRouteDecorator('POST');
export const Delete = createRouteDecorator('DELETE');