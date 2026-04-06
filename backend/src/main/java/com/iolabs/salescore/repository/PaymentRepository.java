package com.iolabs.salescore.repository;

import com.iolabs.salescore.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findBySaleId(Long saleId);

    boolean existsBySaleIdAndPaymentMethodAndAmountPaidAndCreatedAt(
            Long saleId,
            Payment.PaymentMethod paymentMethod,
            BigDecimal amountPaid,
            Instant createdAt
    );

    boolean existsByReferenceNumber(String referenceNumber);

    @Query("SELECT p FROM Payment p LEFT JOIN FETCH p.sale ORDER BY p.id")
    List<Payment> findAllWithSale();
}
