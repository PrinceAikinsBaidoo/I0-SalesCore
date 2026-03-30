package com.iolabs.salescore.repository;

import com.iolabs.salescore.model.Customer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {

    Optional<Customer> findByEmail(String email);

    Optional<Customer> findByNameAndPhone(String name, String phone);

    boolean existsByEmail(String email);

    @Query("""
        SELECT c FROM Customer c
        WHERE :search IS NULL
           OR LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%'))
           OR LOWER(c.email) LIKE LOWER(CONCAT('%', :search, '%'))
           OR c.phone LIKE CONCAT('%', :search, '%')
    """)
    Page<Customer> searchCustomers(String search, Pageable pageable);
}
