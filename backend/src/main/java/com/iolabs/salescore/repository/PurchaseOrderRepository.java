package com.iolabs.salescore.repository;

import com.iolabs.salescore.model.PurchaseOrder;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, Long> {

    boolean existsByPoNumber(String poNumber);

    @EntityGraph(attributePaths = {"supplier", "createdBy", "approvedBy", "items", "items.product"})
    Optional<PurchaseOrder> findById(Long id);

    @Query("""
        SELECT DISTINCT po FROM PurchaseOrder po
        LEFT JOIN FETCH po.supplier
        LEFT JOIN FETCH po.createdBy
        LEFT JOIN FETCH po.approvedBy
        LEFT JOIN FETCH po.items i
        LEFT JOIN FETCH i.product
        WHERE (:supplierId IS NULL OR po.supplier.id = :supplierId)
          AND (:status IS NULL OR po.status = :status)
        ORDER BY po.createdAt DESC
    """)
    List<PurchaseOrder> findAllWithFilters(Long supplierId, PurchaseOrder.Status status);

    @Query("""
        SELECT DISTINCT po FROM PurchaseOrder po
        LEFT JOIN FETCH po.supplier
        LEFT JOIN FETCH po.createdBy
        LEFT JOIN FETCH po.approvedBy
        LEFT JOIN FETCH po.items i
        LEFT JOIN FETCH i.product
        WHERE (:supplierId IS NULL OR po.supplier.id = :supplierId)
          AND (:status IS NULL OR po.status = :status)
          AND po.expectedDate IS NOT NULL
          AND po.expectedDate < :today
          AND po.status IN :openStatuses
        ORDER BY po.expectedDate ASC, po.createdAt DESC
    """)
    List<PurchaseOrder> findOverdueWithFilters(
            @Param("supplierId") Long supplierId,
            @Param("status") PurchaseOrder.Status status,
            @Param("today") LocalDate today,
            @Param("openStatuses") List<PurchaseOrder.Status> openStatuses
    );
}
