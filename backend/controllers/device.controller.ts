//will contain devices and their public key pairs

import { Controller } from "../decorator";
import { BaseController } from "./primitives/base.controller";

@Controller("/devices")
export class DeviceController extends BaseController {
    constructor() {
        super({ topic: "devices" });
    }

    async registerDevice(req: Request) {
        const body = await req.json() as { deviceId: string, publicKey: string };
        //device will be authenticated by its pubkey and will get immutable identifier when it first logs in.

        if (!body.deviceId || !body.publicKey) {
            return Response.json({ error: "Missing deviceId or publicKey" }, { status: 400 });
        }
        this.kafka([{ key: "device_registration", value: JSON.stringify({ deviceId: body.deviceId, publicKey: body.publicKey }) }]);
        return Response.json({ message: "Device registered successfully" }, { status: 200 });
    }
}