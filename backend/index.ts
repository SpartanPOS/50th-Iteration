import { serve } from "bun";
import { LogLayer } from "loglayer";
import { getSimplePrettyTerminal } from "@loglayer/transport-simple-pretty-terminal";
// import * as kafka from "./events/kafka";

import "reflect-metadata";
import { AdminController } from "./controllers/config.controller";
import { ItemController } from "./controllers/items.controller";
import { UserController } from "./controllers/users.controller";
import { AdminController } from "./controllers/config.controller";
import { TXController } from "./controllers/tx.controller";
import { MenuController } from "./controllers/menu.controller";

import { extractPathParams } from "./decorator";
import type { RouteDefinition, RouteHandler } from "./decorator";
import { verifyJWT } from "./jwt";


function pathPatternToRegExp(path: string): RegExp {
    const pattern = path
        .split("/")
        .map(segment => {
            if (segment.startsWith(":")) return "([^/]+)";
            return segment.replace(/[-\\^$*+?.()|[\]{}]/g, "\\$&");
        })
        .join("/");
    return new RegExp(`^${pattern}$`);
}

export const log = new LogLayer({
    prefix: "[Web Backend]",
    transport: getSimplePrettyTerminal({
        runtime: "node",
        viewMode: "inline"
    })
});

// import { kafka } from "./events/kafka";

log.info('Starting the server...');

async function main() {
    // allow any controller constructor (avoid forcing an index-signature on instances)
    const controllers: Array<new (...args: any[]) => unknown> = [AdminController, ItemController, UserController, TXController, MenuController];

    interface RouteConfig {
        handler: RouteHandler;
        authLevel: number;
        pattern: RegExp;
        routePath: string;
    }

    // Map to store runtime routes for fast lookup
    const routesMap = new Map<string, RouteConfig>();

    // Build the routing table
    controllers.forEach((ControllerClass) => {
        const instance = new ControllerClass();
        const basePath = Reflect.getMetadata("basePath", ControllerClass) as string | undefined;
        const routes = Reflect.getMetadata("routes", ControllerClass) as RouteDefinition[] | undefined;
        log.info(`Checking controller: ${ControllerClass.name}, basePath: ${basePath}, routes count: ${routes?.length}`);

        if (!routes || !basePath) return;

        routes.forEach((route) => {
            // Construct full path and normalize slashes
            const fullPath = `${basePath}${route.path}`.replace(/\/+/g, "/").replace(/\/$/, "") || "/";
            const lookupKey = `${route.method}:${fullPath}`;
            const pattern = pathPatternToRegExp(fullPath);

            // get the handler safely and validate
            const handler = (instance as Record<string, RouteHandler | undefined>)[route.methodName];
            if (!handler) {
                throw new Error(`Handler "${route.methodName}" not found on ${ControllerClass.name}`);
            }

            // Bind the controller instance method so 'this' context isn't lost
            routesMap.set(lookupKey, {
                handler: handler.bind(instance),
                authLevel: route.authLevel,
                pattern,
                routePath: fullPath,
            });
            log.info(`Registered route: ${lookupKey} with authLevel ${route.authLevel}`);
        });
    });

    // Start the Bun Server
    const server = serve({
        port: 3000,
        async fetch(req) {
            const startTime = performance.now();
            const url = new URL(req.url);
            const pathname = url.pathname === "/" ? "/" : url.pathname.replace(/\/$/, "");
            const lookupKey = `${req.method}:${pathname}`;
            let routeConfig = routesMap.get(lookupKey);
            let routeParams: Record<string, string> | undefined;

            if (!routeConfig) {
                for (const [key, config] of routesMap.entries()) {
                    if (!key.startsWith(`${req.method}:`)) continue;
                    if (config.pattern.test(pathname)) {
                        routeConfig = config;
                        routeParams = extractPathParams(config.routePath, pathname) ?? undefined;
                        break;
                    }
                }
            } else {
                routeParams = extractPathParams(routeConfig.routePath, pathname) ?? undefined;
            }
            const requestMetadata = {
                method: req.method,
                path: url.pathname,
            };

            if (routeConfig) {
                try {
                    // Check authLevel
                    if (routeConfig.authLevel > 0) {
                        const authHeader = req.headers.get("Authorization");
                        if (!authHeader || !authHeader.startsWith("Bearer ")) {
                            return new Response(
                                JSON.stringify({ error: "Unauthorized: Missing or invalid token format" }),
                                { status: 401, headers: { "Content-Type": "application/json" } }
                            );
                        }
                        const token = authHeader.substring(7);
                        const decoded = await verifyJWT(token);
                        if (!decoded) {
                            return new Response(
                                JSON.stringify({ error: "Unauthorized: Invalid or expired token" }),
                                { status: 401, headers: { "Content-Type": "application/json" } }
                            );
                        }
                        if (decoded.auth_level < routeConfig.authLevel) {
                            return new Response(
                                JSON.stringify({ error: "Forbidden: Insufficient permissions" }),
                                { status: 403, headers: { "Content-Type": "application/json" } }
                            );
                        }
                        // Attach user details to request object
                        (req as any).user = decoded;
                    }

                    return await routeConfig.handler(req, routeParams);
                } catch (err) {
                    log.error('Error handling request:' + err);
                    return new Response("Internal Server Error", { status: 500 });
                } finally {
                    const duration = performance.now() - startTime;
                    log.withMetadata({
                        ...requestMetadata,
                        statusCode: 200,
                        durationMs: parseFloat(duration.toFixed(3)), // Accurate to microseconds
                    }).info("HTTP request processed successfully");
                }
            }

            return new Response("Not Found", { status: 404 });
        }
    });
    log.info(`Server is running on ${server.hostname}:${server.port}`);
}

if (process.env.NODE_ENV !== "test" && process.env.BUN_ENV !== "test") {
    try {
        main();
    } catch (error) {
        log.error('An error occurred:' + error);
        console.error('An error occurred:', error);
    }
}