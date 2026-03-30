package com.iolabs.salescore.service;

import com.iolabs.salescore.exception.ApiException;
import com.iolabs.salescore.exception.ResourceNotFoundException;
import com.iolabs.salescore.model.Category;
import com.iolabs.salescore.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public List<Category> getAll() {
        return categoryRepository.findAll();
    }

    public Category getById(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", id));
    }

    @Transactional
    public Category create(String name, String description) {
        if (categoryRepository.existsByName(name)) {
            throw new ApiException(HttpStatus.CONFLICT, "Category already exists: " + name);
        }
        return categoryRepository.save(Category.builder().name(name).description(description).build());
    }

    @Transactional
    public Category update(Long id, String name, String description) {
        Category category = getById(id);
        category.setName(name);
        category.setDescription(description);
        return categoryRepository.save(category);
    }

    @Transactional
    public void delete(Long id) {
        if (!categoryRepository.existsById(id)) {
            throw new ResourceNotFoundException("Category", id);
        }
        categoryRepository.deleteById(id);
    }
}
