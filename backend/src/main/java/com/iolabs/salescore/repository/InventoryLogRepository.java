package com.iolabs.salescore.repository;

import com.iolabs.salescore.model.InventoryLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InventoryLogRepository extends JpaRepository<InventoryLog, Long> {

    @Query(
            value = """
        SELECT l FROM InventoryLog l
        LEFT JOIN FETCH l.product
        LEFT JOIN FETCH l.user
        WHERE (COALESCE(:productId, l.product.id) = l.product.id)
        AND (COALESCE(:type, l.adjustmentType) = l.adjustmentType)
    """,
            countQuery = """
        SELECT COUNT(l) FROM InventoryLog l
        WHERE (COALESCE(:productId, l.product.id) = l.product.id)
        AND (COALESCE(:type, l.adjustmentType) = l.adjustmentType)
    """
    )
    Page<InventoryLog> findLogs(Long productId, InventoryLog.AdjustmentType type, Pageable pageable);

    @Query("""
        SELECT l FROM InventoryLog l
        LEFT JOIN FETCH l.product
        LEFT JOIN FETCH l.user
        ORDER BY l.id
    """)
    List<InventoryLog> findAllWithDetails();

    boolean existsByProductIdAndUserIdAndAdjustmentTypeAndQuantityChangeAndPreviousQuantityAndNewQuantityAndReason(
            Long productId,
            Long userId,
            InventoryLog.AdjustmentType adjustmentType,
            Integer quantityChange,
            Integer previousQuantity,
            Integer newQuantity,
            String reason
    );
}
