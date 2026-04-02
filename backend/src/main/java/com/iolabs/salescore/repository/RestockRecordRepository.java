package com.iolabs.salescore.repository;

import com.iolabs.salescore.model.RestockRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Repository
public interface RestockRecordRepository extends JpaRepository<RestockRecord, Long> {

    @Query(value = """
        SELECT r FROM RestockRecord r
        WHERE (COALESCE(:productId, r.product.id) = r.product.id)
          AND (COALESCE(:supplierId, r.supplier.id) = r.supplier.id)
    """,
    countQuery = """
        SELECT COUNT(r) FROM RestockRecord r
        WHERE (COALESCE(:productId, r.product.id) = r.product.id)
          AND (COALESCE(:supplierId, r.supplier.id) = r.supplier.id)
    """)
    Page<RestockRecord> findHistory(Long productId, Long supplierId, Pageable pageable);

    @Query("""
        SELECT COUNT(DISTINCT r.supplier.id)
        FROM RestockRecord r
        WHERE (r.createdAt >= COALESCE(:from, r.createdAt))
          AND (r.createdAt <= COALESCE(:to, r.createdAt))
    """)
    Long countDistinctSuppliers(Instant from, Instant to);

    @Query("""
        SELECT COALESCE(SUM(r.quantity), 0)
        FROM RestockRecord r
        WHERE (r.createdAt >= COALESCE(:from, r.createdAt))
          AND (r.createdAt <= COALESCE(:to, r.createdAt))
    """)
    Long sumRestockedQuantity(Instant from, Instant to);

    @Query("""
        SELECT COALESCE(SUM(COALESCE(r.unitCost, 0) * r.quantity), 0)
        FROM RestockRecord r
        WHERE (r.createdAt >= COALESCE(:from, r.createdAt))
          AND (r.createdAt <= COALESCE(:to, r.createdAt))
    """)
    BigDecimal sumRestockedValue(Instant from, Instant to);

    @Query("""
        SELECT r.supplier.id, r.supplier.name, COUNT(r), SUM(r.quantity),
               COALESCE(SUM(COALESCE(r.unitCost, 0) * r.quantity), 0), MAX(r.createdAt)
        FROM RestockRecord r
        WHERE (r.createdAt >= COALESCE(:from, r.createdAt))
          AND (r.createdAt <= COALESCE(:to, r.createdAt))
        GROUP BY r.supplier.id, r.supplier.name
        ORDER BY SUM(r.quantity) DESC
    """)
    List<Object[]> findTopSuppliers(Instant from, Instant to, Pageable pageable);
}
