package com.iolabs.salescore.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app")
public class AppProperties {

    private final Bootstrap bootstrap = new Bootstrap();
    private final Cors cors = new Cors();

    @Getter
    @Setter
    public static class Bootstrap {
        /**
         * Shared secret required to call POST /api/v1/auth/bootstrap.
         * If blank, bootstrap is disabled.
         */
        private String token = "";
    }

    @Getter
    @Setter
    public static class Cors {
        /**
         * Comma-separated browser origins allowed for CORS (e.g. https://app.example.com,http://localhost:5173).
         */
        private String allowedOrigins = "http://localhost:5173,http://localhost:5174,http://localhost:3000";
    }
}
