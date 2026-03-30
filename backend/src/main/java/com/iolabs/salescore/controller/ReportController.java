package com.iolabs.salescore.controller;

import com.iolabs.salescore.model.Product;
import com.iolabs.salescore.repository.ProductRepository;
import com.iolabs.salescore.repository.RestockRecordRepository;
import com.iolabs.salescore.repository.SaleRepository;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
@Tag(name = "Reports")
public class ReportController {

    private final SaleRepository saleRepository;
    private final ProductRepository productRepository;
    private final RestockRecordRepository restockRecordRepository;

    @GetMapping("/sales/daily")
    public ResponseEntity<Map<String, Object>> dailySales() {
        Instant startOfDay = Instant.now().truncatedTo(ChronoUnit.DAYS);
        Instant endOfDay = startOfDay.plus(1, ChronoUnit.DAYS);
        return buildSummary(startOfDay, endOfDay);
    }

    @GetMapping("/sales/weekly")
    public ResponseEntity<Map<String, Object>> weeklySales() {
        Instant now = Instant.now();
        Instant weekAgo = now.minus(7, ChronoUnit.DAYS);
        return buildSummary(weekAgo, now);
    }

    @GetMapping("/sales/range")
    public ResponseEntity<Map<String, Object>> rangedSales(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to
    ) {
        return buildSummary(from, to);
    }

    @GetMapping("/products/top")
    public ResponseEntity<List<Object[]>> topProducts(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @RequestParam(defaultValue = "10") int limit
    ) {
        Instant f = from != null ? from : Instant.now().minus(30, ChronoUnit.DAYS);
        Instant t = to != null ? to : Instant.now();
        return ResponseEntity.ok(saleRepository.findTopProducts(f, t, PageRequest.of(0, limit)));
    }

    @GetMapping("/inventory")
    public ResponseEntity<Map<String, Object>> inventoryReport() {
        List<Product> lowStock = productRepository.findLowStockProducts();
        long totalProducts = productRepository.count();
        Map<String, Object> report = new HashMap<>();
        report.put("totalProducts", totalProducts);
        report.put("lowStockCount", lowStock.size());
        report.put("lowStockItems", lowStock);
        return ResponseEntity.ok(report);
    }

    @GetMapping("/cashiers")
    public ResponseEntity<List<Object[]>> cashierPerformance(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to
    ) {
        Instant f = from != null ? from : Instant.now().minus(30, ChronoUnit.DAYS);
        Instant t = to != null ? to : Instant.now();
        return ResponseEntity.ok(saleRepository.findCashierPerformance(f, t));
    }

    @GetMapping("/suppliers/summary")
    public ResponseEntity<Map<String, Object>> supplierSummary(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to
    ) {
        Instant f = from != null ? from : Instant.now().minus(30, ChronoUnit.DAYS);
        Instant t = to != null ? to : Instant.now();
        Map<String, Object> summary = new HashMap<>();
        summary.put("from", f);
        summary.put("to", t);
        summary.put("supplierCount", restockRecordRepository.countDistinctSuppliers(f, t));
        summary.put("totalRestockedQty", restockRecordRepository.sumRestockedQuantity(f, t));
        summary.put("totalRestockedValue", restockRecordRepository.sumRestockedValue(f, t));
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/suppliers/top")
    public ResponseEntity<List<Object[]>> topSuppliers(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @RequestParam(defaultValue = "10") int limit
    ) {
        Instant f = from != null ? from : Instant.now().minus(30, ChronoUnit.DAYS);
        Instant t = to != null ? to : Instant.now();
        return ResponseEntity.ok(restockRecordRepository.findTopSuppliers(f, t, PageRequest.of(0, limit)));
    }

    @GetMapping("/suppliers/export/csv")
    public ResponseEntity<byte[]> exportTopSuppliersCsv(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @RequestParam(defaultValue = "8") int limit
    ) {
        Instant f = from != null ? from : Instant.now().minus(30, ChronoUnit.DAYS);
        Instant t = to != null ? to : Instant.now();
        List<Object[]> rows = restockRecordRepository.findTopSuppliers(f, t, PageRequest.of(0, limit));
        String header = "supplierId,supplierName,restockCount,totalUnits,totalValue,lastDelivery,from,to";
        String body = rows.stream()
                .map(r -> String.join(",",
                        csv(r[0]),
                        csv(r[1]),
                        csv(r[2]),
                        csv(r[3]),
                        csv(r[4]),
                        csv(r[5]),
                        csv(f),
                        csv(t)
                ))
                .reduce((a, b) -> a + "\n" + b)
                .orElse("");
        String csvData = header + (body.isEmpty() ? "" : "\n" + body);
        String filename = "supplier-analytics-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss")) + ".csv";
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=\"" + filename + "\"")
                .header("Content-Type", "text/csv")
                .body(csvData.getBytes(StandardCharsets.UTF_8));
    }

    private ResponseEntity<Map<String, Object>> buildSummary(Instant from, Instant to) {
        BigDecimal revenue = saleRepository.sumRevenueByDateRange(from, to);
        Long count = saleRepository.countByDateRange(from, to);
        Map<String, Object> summary = new HashMap<>();
        summary.put("from", from);
        summary.put("to", to);
        summary.put("totalRevenue", revenue);
        summary.put("totalSales", count);
        summary.put("averageSale", count > 0 ? revenue.divide(BigDecimal.valueOf(count), 2, java.math.RoundingMode.HALF_UP) : BigDecimal.ZERO);
        return ResponseEntity.ok(summary);
    }

    private String csv(Object v) {
        if (v == null) return "";
        String s = String.valueOf(v);
        if (s.contains("\"")) s = s.replace("\"", "\"\"");
        if (s.contains(",") || s.contains("\n") || s.contains("\r")) return "\"" + s + "\"";
        return s;
    }
}
