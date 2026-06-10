import { DiscoveryService } from './discovery.service';
export declare class DiscoveryController {
    private readonly discoveryService;
    constructor(discoveryService: DiscoveryService);
    findNearby(req: any, radius?: string): Promise<{
        users: never[];
        message: string;
        myLocation?: undefined;
    } | {
        users: any;
        myLocation: {
            lat: any;
            lng: any;
        };
        message?: undefined;
    }>;
}
