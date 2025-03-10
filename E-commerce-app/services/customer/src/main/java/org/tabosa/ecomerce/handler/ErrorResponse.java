package org.tabosa.ecomerce.handler;

import java.util.Map;

public record ErrorResponse(
        Map<String, String> errors
) {
}
