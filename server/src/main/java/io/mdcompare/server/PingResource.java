package io.mdcompare.server;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import java.util.Map;

@Path("/api/ping")
public class PingResource {
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public Map<String, Boolean> ping() {
        return Map.of("ok", true);
    }
}
