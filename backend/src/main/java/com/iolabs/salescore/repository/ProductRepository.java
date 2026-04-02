package com.iolabs.salescore.repository;

import com.iolabs.salescore.model.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    Optional<Product> findByBarcode(String barcode);

    Optional<Product> findByNameAndCategory_Id(String name, Long categoryId);

    boolean existsByBarcode(String barcode);

    // Native SQL to avoid Hibernate passing typed NULL as bytea which breaks lower() in PostgreSQL.
    // Uses CAST(:search AS text) so PostgreSQL always gets a text-typed parameter.
    @Query(value = """
        SELECT p.* FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.active = true
          AND (CAST(:search AS text) IS NULL
               OR LOWER(p.name) LIKE LOWER(CONCAT('%', CAST(:search AS text), '%'))
               OR p.barcode LIKE CONCAT('%', CAST(:search AS text), '%'))
          AND (CAST(:categoryId AS bigint) IS NULL OR p.category_id = CAST(:categoryId AS bigint))
        ORDER BY p.name
    """,
    countQuery = """
        SELECT COUNT(*) FROM products p
        WHERE p.active = true
          AND (CAST(:search AS text) IS NULL
               OR LOWER(p.name) LIKE LOWER(CONCAT('%', CAST(:search AS text), '%'))
               OR p.barcode LIKE CONCAT('%', CAST(:search AS text), '%'))
          AND (CAST(:categoryId AS bigint) IS NULL OR p.category_id = CAST(:categoryId AS bigint))
    """,
    nativeQuery = true)
    Page<Product> searchProductsNative(@Param("search") String search,
                                       @Param("categoryId") Long categoryId,
                                       Pageable pageable);

    @Query("SELECT p FROM Product p LEFT JOIN FETCH p.category WHERE p.active = true AND p.quantity <= p.lowStockThreshold")
    List<Product> findLowStockProducts();

    @Query("SELECT p FROM Product p LEFT JOIN FETCH p.category WHERE p.id = :id")
    Optional<Product> findByIdWithCategory(Long id);

    @Query("SELECT p FROM Product p LEFT JOIN FETCH p.category ORDER BY p.id")
    List<Product> findAllWithCategory();
}
