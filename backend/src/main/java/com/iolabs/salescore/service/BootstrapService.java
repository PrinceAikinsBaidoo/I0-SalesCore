package com.iolabs.salescore.service;

import com.iolabs.salescore.config.AppProperties;
import com.iolabs.salescore.dto.request.BootstrapRequest;
import com.iolabs.salescore.exception.ApiException;
import com.iolabs.salescore.model.User;
import com.iolabs.salescore.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class BootstrapService {

    private final AppProperties appProperties;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public Map<String, Object> createFirstAdmin(BootstrapRequest request) {
        if (!StringUtils.hasText(appProperties.getBootstrap().getToken())) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Bootstrap is disabled");
        }
        if (!appProperties.getBootstrap().getToken().equals(request.token())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Invalid bootstrap token");
        }
        if (userRepository.existsByRole(User.Role.ADMIN)) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "An administrator already exists. Log in or change the password from Settings/Users.");
        }
        if (userRepository.existsByUsername(request.username())) {
            throw new ApiException(HttpStatus.CONFLICT, "Username already taken");
        }
        if (userRepository.existsByEmail(request.email())) {
            throw new ApiException(HttpStatus.CONFLICT, "Email already registered");
        }

        User admin = User.builder()
                .username(request.username().trim())
                .email(request.email().trim())
                .passwordHash(passwordEncoder.encode(request.password()))
                .fullName(request.fullName().trim())
                .phone(request.phone() != null ? request.phone().trim() : null)
                .role(User.Role.ADMIN)
                .active(true)
                .build();
        User saved = userRepository.save(admin);

        return Map.of(
                "message", "Administrator created successfully",
                "userId", saved.getId(),
                "username", saved.getUsername()
        );
    }
}
