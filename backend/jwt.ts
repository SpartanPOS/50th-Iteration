const JWT_SECRET = process.env.JWT_SECRET || "super-secret-development-key-change-me";

// Base64Url helper functions
function base64urlEncode(str: string): string {
  const bytes = new TextEncoder().encode(str);
  const binString = String.fromCodePoint(...bytes);
  return btoa(binString)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64urlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binString = atob(base64);
  const bytes = Uint8Array.from(binString, (m) => m.codePointAt(0)!);
  return new TextDecoder().decode(bytes);
}

// HMAC-SHA256 helper using Web Crypto
async function hmacSha256(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  const hashBytes = new Uint8Array(signature);
  const hashBinString = String.fromCodePoint(...hashBytes);
  return btoa(hashBinString)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export interface JWTPayload {
  id?: string | number;
  username?: string;
  auth_level: number;
  exp?: number;
  [key: string]: any;
}

export async function signJWT(payload: JWTPayload, secret: string = JWT_SECRET): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64urlEncode(JSON.stringify(header));
  const encodedPayload = base64urlEncode(JSON.stringify(payload));
  const signature = await hmacSha256(`${encodedHeader}.${encodedPayload}`, secret);
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export async function verifyJWT(token: string, secret: string = JWT_SECRET): Promise<JWTPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerPart, payloadPart, signaturePart] = parts;
    const expectedSignature = await hmacSha256(`${headerPart}.${payloadPart}`, secret);
    
    if (signaturePart !== expectedSignature) {
      return null;
    }

    const payload = JSON.parse(base64urlDecode(payloadPart)) as JWTPayload;
    
    // Check expiration if present
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
