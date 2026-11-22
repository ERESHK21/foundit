package com.foundit.auth;

import com.foundit.user.User;
import java.util.Set;
import org.springframework.stereotype.Component;

@Component
public class AuthFacade {

    public static final Set<String> STAFF_ROLES = Set.of("ROLE_STAFF", "ROLE_ADMIN");

    public User current() {
        var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof User user)) {
            throw com.foundit.common.ApiException.unauthorized("Sign in to continue");
        }
        return user;
    }
}
