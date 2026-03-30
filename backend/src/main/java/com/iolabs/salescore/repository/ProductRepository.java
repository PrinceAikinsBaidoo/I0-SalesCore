package com.iolabs.salescore.repository;

import com.iolabs.salescore.model.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    Optional<Product> findByBarcode(String barcode);

    Optional<Product> findByNameAndCategory_Id(String name, Long categoryId);

    boolean existsByBarcode(String barcode);

    @Query(value = """
        SELECT p FROM Product p LEFT JOIN FETCH p.category
        WHERE p.active = true
        AND (:search IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%'))
             OR p.barcode LIKE CONCAT('%', :search, '%'))
        AND (:categoryId IS NULL OR p.category.id = :categoryId)
    """,
    countQuery = """
        SELECT COUNT(p) FROM Product p
        WHERE p.active = true
        AND (:search IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%'))
             OR p.barcode LIKE CONCAT('%', :search, '%'))
        AND (:categoryId IS NULL OR p.category.id = :categoryId)
    """)
    Page<Product> searchProducts(String search, Long categoryId, Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.active = true AND p.quantity <= p.lowStockThreshold")
    List<Product> findLowStockProducts();

    @Query("SELECT p FROM Product p LEFT JOIN FETCH p.category WHERE p.id = :id")
    Optional<Product> findByIdWithCategory(Long id);

    @Query("SELECT p FROM Product p LEFT JOIN FETCH p.category ORDER BY p.id")
    List<Product> findAllWithCategory();
}
