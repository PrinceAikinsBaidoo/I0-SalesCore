package com.iolabs.salescore.repository;

import com.iolabs.salescore.dto.response.RefundEventResponse;
import com.iolabs.salescore.model.RefundEvent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.Instant;

@Repository
public interface RefundEventRepository extends JpaRepository<RefundEvent, Long> {

    @Query(value = """
        SELECT new com.iolabs.salescore.dto.response.RefundEventResponse(
            r.id,
            s.id,
            s.saleNumber,
            si.id,
            p.id,
            p.name,
            r.quantity,
            r.refundAmount,
            r.reason,
            u.id,
            u.fullName,
            r.createdAt
        )
        FROM RefundEvent r
        JOIN r.sale s
        JOIN r.saleItem si
        JOIN r.product p
        JOIN r.refundedBy u
        WHERE (COALESCE(:saleId, s.id) = s.id)
          AND (COALESCE(:userId, u.id) = u.id)
          AND (r.createdAt >= COALESCE(:from, r.createdAt))
          AND (r.createdAt <= COALESCE(:to, r.createdAt))
    """,
    countQuery = """
        SELECT COUNT(r)
        FROM RefundEvent r
        JOIN r.sale s
        JOIN r.refundedBy u
        WHERE (COALESCE(:saleId, s.id) = s.id)
          AND (COALESCE(:userId, u.id) = u.id)
          AND (r.createdAt >= COALESCE(:from, r.createdAt))
          AND (r.createdAt <= COALESCE(:to, r.createdAt))
    """)
    Page<RefundEventResponse> findHistory(Long saleId, Long userId, Instant from, Instant to, Pageable pageable);
}
