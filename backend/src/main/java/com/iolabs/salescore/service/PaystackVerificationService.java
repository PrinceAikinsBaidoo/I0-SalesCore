package com.iolabs.salescore.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.iolabs.salescore.config.AppProperties;
import com.iolabs.salescore.exception.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;

@Service
@RequiredArgsConstructor
public class PaystackVerificationService {

    private final AppProperties appProperties;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newHttpClient();

    public void verifySuccessfulCharge(String reference, BigDecimal expectedAmount) {
        var config = appProperties.getPaystack();
        if (!config.isVerificationEnabled()) {
            return;
        }

        String secretKey = config.getSecretKey() != null ? config.getSecretKey().trim() : "";
        if (secretKey.isEmpty()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Online payment verification is not configured on the server");
        }

        String base = config.getVerifyUrl() != null ? config.getVerifyUrl().trim() : "";
        if (base.isEmpty()) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Paystack verify URL is not configured");
        }

        String encodedRef = URLEncoder.encode(reference, StandardCharsets.UTF_8);
        URI uri = URI.create(base + "/" + encodedRef);

        HttpRequest request = HttpRequest.newBuilder(uri)
                .header("Authorization", "Bearer " + secretKey)
                .header("Accept", "application/json")
                .GET()
                .build();

        HttpResponse<String> response;
        try {
            response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        } catch (Exception ex) {
            throw new ApiException(HttpStatus.BAD_GATEWAY,
                    "Could not verify payment with Paystack");
        }

        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new ApiException(HttpStatus.BAD_GATEWAY,
                    "Paystack verification failed with status " + response.statusCode());
        }

        JsonNode root;
        try {
            root = objectMapper.readTree(response.body());
        } catch (Exception ex) {
            throw new ApiException(HttpStatus.BAD_GATEWAY,
                    "Invalid response from Paystack verification");
        }

        if (!root.path("status").asBoolean(false)) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Paystack could not verify this payment reference");
        }

        JsonNode data = root.path("data");
        String paymentStatus = data.path("status").asText("");
        if (!"success".equalsIgnoreCase(paymentStatus)) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Payment is not marked successful on Paystack");
        }

        String currency = data.path("currency").asText("");
        String expectedCurrency = config.getExpectedCurrency() != null
                ? config.getExpectedCurrency().trim()
                : "GHS";
        if (!expectedCurrency.isBlank() && !expectedCurrency.equalsIgnoreCase(currency)) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Payment currency mismatch: expected " + expectedCurrency + ", got " + currency);
        }

        long expectedSmallest = expectedAmount
                .multiply(BigDecimal.valueOf(100))
                .setScale(0, RoundingMode.HALF_UP)
                .longValueExact();
        long actualSmallest = data.path("amount").asLong(Long.MIN_VALUE);
        if (actualSmallest != expectedSmallest) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Payment amount mismatch for verified Paystack transaction");
        }
    }
}
