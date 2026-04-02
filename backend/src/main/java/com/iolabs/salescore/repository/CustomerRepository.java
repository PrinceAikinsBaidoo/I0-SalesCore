package com.iolabs.salescore.repository;

import com.iolabs.salescore.model.Customer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {

    Optional<Customer> findByEmail(String email);

    Optional<Customer> findByNameAndPhone(String name, String phone);

    boolean existsByEmail(String email);

    @Query(value = """
        SELECT c.* FROM customers c
        WHERE CAST(:search AS text) IS NULL
           OR LOWER(c.name) LIKE LOWER(CONCAT('%', CAST(:search AS text), '%'))
           OR LOWER(c.email) LIKE LOWER(CONCAT('%', CAST(:search AS text), '%'))
           OR c.phone LIKE CONCAT('%', CAST(:search AS text), '%')
        ORDER BY c.name
    """,
    countQuery = """
        SELECT COUNT(c.id) FROM customers c
        WHERE CAST(:search AS text) IS NULL
           OR LOWER(c.name) LIKE LOWER(CONCAT('%', CAST(:search AS text), '%'))
           OR LOWER(c.email) LIKE LOWER(CONCAT('%', CAST(:search AS text), '%'))
           OR c.phone LIKE CONCAT('%', CAST(:search AS text), '%')
    """,
    nativeQuery = true)
    Page<Customer> searchCustomers(@Param("search") String search, Pageable pageable);
}
