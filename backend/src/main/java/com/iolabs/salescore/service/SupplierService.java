package com.iolabs.salescore.service;

import com.iolabs.salescore.dto.request.SupplierRequest;
import com.iolabs.salescore.exception.ApiException;
import com.iolabs.salescore.exception.ResourceNotFoundException;
import com.iolabs.salescore.model.Supplier;
import com.iolabs.salescore.repository.SupplierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SupplierService {

    private final SupplierRepository supplierRepository;

    public List<Supplier> getAll(boolean includeInactive) {
        List<Supplier> all = supplierRepository.findAll(Sort.by("name"));
        if (includeInactive) return all;
        return all.stream().filter(Supplier::isActive).toList();
    }

    public Supplier getById(Long id) {
        return supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier", id));
    }

    @Transactional
    public Supplier create(SupplierRequest request) {
        supplierRepository.findByNameIgnoreCase(request.name()).ifPresent(s -> {
            throw new ApiException(HttpStatus.CONFLICT, "Supplier name already exists: " + request.name());
        });
        Supplier supplier = Supplier.builder()
                .name(request.name().trim())
                .contactPerson(request.contactPerson())
                .phone(request.phone())
                .email(request.email())
                .address(request.address())
                .notes(request.notes())
                .active(true)
                .build();
        return supplierRepository.save(supplier);
    }

    @Transactional
    public Supplier update(Long id, SupplierRequest request) {
        Supplier supplier = getById(id);
        supplierRepository.findByNameIgnoreCase(request.name())
                .filter(other -> !other.getId().equals(id))
                .ifPresent(s -> { throw new ApiException(HttpStatus.CONFLICT, "Supplier name already exists: " + request.name()); });

        supplier.setName(request.name().trim());
        supplier.setContactPerson(request.contactPerson());
        supplier.setPhone(request.phone());
        supplier.setEmail(request.email());
        supplier.setAddress(request.address());
        supplier.setNotes(request.notes());
        return supplierRepository.save(supplier);
    }

    @Transactional
    public void deactivate(Long id) {
        Supplier supplier = getById(id);
        supplier.setActive(false);
        supplierRepository.save(supplier);
    }
}
