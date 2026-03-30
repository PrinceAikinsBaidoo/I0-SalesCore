package com.iolabs.salescore.controller;

import com.iolabs.salescore.service.BackupService;
import com.iolabs.salescore.service.BackupImportService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@RestController
@RequestMapping("/api/v1/backup")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Backup")
public class BackupController {

    private final BackupService backupService;
    private final BackupImportService backupImportService;

    @GetMapping("/export/json")
    public ResponseEntity<byte[]> exportJson() {
        byte[] bytes = backupService.exportJsonBytes();
        String filename = "salescore-backup-" + nowStamp() + ".json";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, contentDisposition(filename))
                .contentType(MediaType.APPLICATION_JSON)
                .body(bytes);
    }

    @GetMapping("/export/csv")
    public ResponseEntity<byte[]> exportCsv(@RequestParam String entity) {
        byte[] bytes = backupService.exportCsvBytes(entity);
        String safeEntity = entity.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9_\\-]", "_");
        String filename = "salescore-" + safeEntity + "-" + nowStamp() + ".csv";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, contentDisposition(filename))
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(bytes);
    }

    @PostMapping(value = "/import/json", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<BackupImportService.ImportSummary> importJson(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(backupImportService.importJson(file));
    }

    private String contentDisposition(String filename) {
        return "attachment; filename=\"" + filename + "\"";
    }

    private String nowStamp() {
        return LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss"));
    }
}
