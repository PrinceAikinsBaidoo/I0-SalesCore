package com.iolabs.salescore.service;

import com.iolabs.salescore.dto.request.ProductRequest;
import com.iolabs.salescore.exception.ApiException;
import com.iolabs.salescore.exception.ResourceNotFoundException;
import com.iolabs.salescore.model.Category;
import com.iolabs.salescore.model.Product;
import com.iolabs.salescore.repository.CategoryRepository;
import com.iolabs.salescore.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    public Page<Product> getProducts(String search, Long categoryId, Pageable pageable) {
        return productRepository.searchProductsNative(search, categoryId, pageable);
    }

    public Product getById(Long id) {
        return productRepository.findByIdWithCategory(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", id));
    }

    public Product getByBarcode(String barcode) {
        return productRepository.findByBarcode(barcode)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with barcode: " + barcode));
    }

    public List<Product> getLowStockProducts() {
        return productRepository.findLowStockProducts();
    }

    @Transactional
    public Product create(ProductRequest request) {
        if (request.barcode() != null && productRepository.existsByBarcode(request.barcode())) {
            throw new ApiException(HttpStatus.CONFLICT, "Barcode already in use: " + request.barcode());
        }
        Product product = buildProduct(new Product(), request);
        return productRepository.save(product);
    }

    @Transactional
    public Product update(Long id, ProductRequest request) {
        Product product = getById(id);
        if (request.barcode() != null
                && !request.barcode().equals(product.getBarcode())
                && productRepository.existsByBarcode(request.barcode())) {
            throw new ApiException(HttpStatus.CONFLICT, "Barcode already in use: " + request.barcode());
        }
        buildProduct(product, request);
        return productRepository.save(product);
    }

    @Transactional
    public void deactivate(Long id) {
        Product product = getById(id);
        product.setActive(false);
        productRepository.save(product);
    }

    private Product buildProduct(Product product, ProductRequest req) {
        product.setName(req.name());
        product.setPrice(req.price());
        product.setCostPrice(req.costPrice());
        product.setBarcode(req.barcode());
        product.setDescription(req.description());
        product.setImageUrl(req.imageUrl());
        if (req.quantity() != null) product.setQuantity(req.quantity());
        if (req.lowStockThreshold() != null) product.setLowStockThreshold(req.lowStockThreshold());
        // Explicitly set or clear category based on whether categoryId is provided
        if (req.categoryId() != null) {
            Category category = categoryRepository.findById(req.categoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category", req.categoryId()));
            product.setCategory(category);
        } else {
            product.setCategory(null);
        }
        return product;
    }
}
