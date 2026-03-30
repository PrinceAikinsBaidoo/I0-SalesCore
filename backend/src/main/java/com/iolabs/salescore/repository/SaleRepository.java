package com.iolabs.salescore.repository;

import com.iolabs.salescore.model.Sale;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface SaleRepository extends JpaRepository<Sale, Long> {

    @Query("""
        SELECT s FROM Sale s
        LEFT JOIN FETCH s.user
        LEFT JOIN FETCH s.customer
        WHERE (:from IS NULL OR s.createdAt >= :from)
        AND (:to IS NULL OR s.createdAt <= :to)
        AND (:userId IS NULL OR s.user.id = :userId)
    """)
    Page<Sale> findSales(Instant from, Instant to, Long userId, Pageable pageable);

    @Query("""
        SELECT DISTINCT s FROM Sale s
        LEFT JOIN FETCH s.user
        LEFT JOIN FETCH s.customer
        LEFT JOIN FETCH s.items i
        LEFT JOIN FETCH i.product
        WHERE s.id = :id
    """)
    Optional<Sale> findByIdWithDetails(Long id);

    @Query("""
        SELECT DISTINCT s FROM Sale s
        LEFT JOIN FETCH s.user
        LEFT JOIN FETCH s.customer
        LEFT JOIN FETCH s.items i
        LEFT JOIN FETCH i.product
        ORDER BY s.id
    """)
    List<Sale> findAllWithDetails();

    @Query("SELECT COALESCE(SUM(s.totalAmount), 0) FROM Sale s WHERE s.createdAt >= :from AND s.createdAt <= :to AND s.paymentStatus = 'COMPLETED'")
    BigDecimal sumRevenueByDateRange(Instant from, Instant to);

    @Query("SELECT COUNT(s) FROM Sale s WHERE s.createdAt >= :from AND s.createdAt <= :to AND s.paymentStatus = 'COMPLETED'")
    Long countByDateRange(Instant from, Instant to);

    @Query("""
        SELECT si.product.id, si.productName, SUM(si.quantity) as totalQty, SUM(si.subtotal) as totalRevenue
        FROM SaleItem si
        JOIN si.sale s
        WHERE s.createdAt >= :from AND s.createdAt <= :to AND s.paymentStatus = 'COMPLETED'
        GROUP BY si.product.id, si.productName
        ORDER BY totalQty DESC
    """)
    List<Object[]> findTopProducts(Instant from, Instant to, Pageable pageable);

    @Query("""
        SELECT s.user.id, s.user.fullName, COUNT(s), SUM(s.totalAmount)
        FROM Sale s
        WHERE s.createdAt >= :from AND s.createdAt <= :to AND s.paymentStatus = 'COMPLETED'
        GROUP BY s.user.id, s.user.fullName
        ORDER BY COUNT(s) DESC
    """)
    List<Object[]> findCashierPerformance(Instant from, Instant to);

    Optional<Sale> findBySaleNumber(String saleNumber);

    boolean existsBySaleNumber(String saleNumber);
}
