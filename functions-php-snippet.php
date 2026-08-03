<?php
/**
 * ============================================================
 * CUSTOM WooCommerce REST API — paste into functions.php
 * Replaces WPGraphQL + WooGraphQL plugins entirely.
 * Requires: WooCommerce + JWT Authentication for WP REST API
 * ============================================================
 */

// ── MAINTENANCE MODE (set to true to block ALL REST API) ─────
define( 'CWOO_MAINTENANCE_MODE', false );

add_action( 'init', 'cwoo_maintenance_block', 1 );
function cwoo_maintenance_block() {
    if ( ! CWOO_MAINTENANCE_MODE ) return;
    $uri = isset( $_SERVER['REQUEST_URI'] ) ? $_SERVER['REQUEST_URI'] : '';
    if ( strpos( $uri, '/wp-json/' ) !== false ) {
        http_response_code( 503 );
        header( 'Content-Type: application/json; charset=UTF-8' );
        echo json_encode( [
            'code'    => 'service_unavailable',
            'message' => 'API is temporarily offline for maintenance.',
        ] );
        exit;
    }
}

// ── ENSURE SESSION AND CUSTOMER ENV FOR REST REQUESTS ─────────
add_action( 'woocommerce_init', 'cwoo_init_rest_session_customer', 5 );
function cwoo_init_rest_session_customer() {
    if ( defined( 'REST_REQUEST' ) && REST_REQUEST && function_exists( 'WC' ) ) {
        if ( null === WC()->session ) {
            if ( ! class_exists( 'WC_Session_Handler' ) ) {
                include_once WC_ABSPATH . 'includes/class-wc-session-handler.php';
            }
            WC()->session = new WC_Session_Handler();
            WC()->session->init();
        }
        if ( is_user_logged_in() ) {
            $uid = get_current_user_id();
            if ( null === WC()->customer || WC()->customer->get_id() !== $uid ) {
                WC()->customer = new WC_Customer( $uid, true );
            }
        } else if ( defined( 'CWOO_WHOLESALE_USER_ID' ) && CWOO_WHOLESALE_USER_ID ) {
            wp_set_current_user( (int) CWOO_WHOLESALE_USER_ID );
            if ( null === WC()->customer || WC()->customer->get_id() !== (int) CWOO_WHOLESALE_USER_ID ) {
                WC()->customer = new WC_Customer( (int) CWOO_WHOLESALE_USER_ID, true );
            }
        }
    }
}
// ─────────────────────────────────────────────────────────────

// ── CORS ─────────────────────────────────────────────────────
add_action( 'init', 'cwoo_cors_headers' );
function cwoo_cors_headers() {
    $allowed = [
        'http://localhost:3000',
        'http://localhost:3001',
        'https://headless-woo-commerce-with-next-js.vercel.app',
    ];
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if ( in_array( $origin, $allowed, true ) ) {
        header( "Access-Control-Allow-Origin: {$origin}" );
        header( 'Access-Control-Allow-Credentials: true' );
        header( 'Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS' );
        header( 'Access-Control-Allow-Headers: Authorization, Content-Type, X-WP-Nonce, Cart-Token, Nonce' );
        // Expose the Store API cart/session headers to the JS client (proxy).
        header( 'Access-Control-Expose-Headers: Cart-Token, Nonce, X-WC-Store-API-Nonce, X-WP-Total, X-WP-TotalPages' );
    }
    if ( $_SERVER['REQUEST_METHOD'] === 'OPTIONS' ) {
        status_header( 200 );
        exit();
    }
}

// ── EXCLUDE "marketing-materials" FROM GENERAL LISTINGS ──────
// These products should only appear on /category/marketing-materials. Exclude
// them from every Store API product listing (home, shop, search) UNLESS the
// request explicitly asks for that category.
add_filter( 'woocommerce_store_api_product_query', 'cwoo_exclude_marketing_materials', 10, 2 );
function cwoo_exclude_marketing_materials( $args, $request ) {
    $term = get_term_by( 'slug', 'marketing-materials', 'product_cat' );
    if ( ! $term ) return $args;

    $requested = $request['category'] ?? '';
    if ( is_string( $requested ) ) $requested = explode( ',', $requested );
    $requested = array_map( 'absint', (array) $requested );
    if ( in_array( (int) $term->term_id, $requested, true ) ) return $args;

    if ( empty( $args['tax_query'] ) || ! is_array( $args['tax_query'] ) ) {
        $args['tax_query'] = [];
    }
    $args['tax_query'][] = [
        'taxonomy' => 'product_cat',
        'field'    => 'term_id',
        'terms'    => [ (int) $term->term_id ],
        'operator' => 'NOT IN',
    ];
    return $args;
}

// ── STORE API (headless cart) ────────────────────────────────
// The decoupled Next.js frontend talks to /wc/store/v1/cart cross-origin and
// authenticates each cart with the Cart-Token header instead of a cookie nonce.
// Disable the CSRF nonce check so the Cart-Token alone is sufficient.
add_filter( 'woocommerce_store_api_disable_nonce_check', '__return_true' );

// ── PERMISSION HELPER ────────────────────────────────────────
function cwoo_auth_required() {
    if ( ! is_user_logged_in() ) {
        return new WP_Error( 'rest_forbidden', 'Authentication required.', [ 'status' => 401 ] );
    }
    return true;
}

// ── ⚠️  TEMPORARY TEST KILL-SWITCH ───────────────────────────
// Set to true to simulate API-down state (returns 503 on all endpoints).
// Remove or set to false before deploying.
define( 'CWOO_SIMULATE_DOWN', false );

// ── REGISTER ROUTES ──────────────────────────────────────────
add_action( 'rest_api_init', 'cwoo_register_routes' );
function cwoo_register_routes() {
    // Initialize the WC Customer object dynamically for all authed REST API requests
    // so role/group prices resolve automatically on any get/post endpoints.
    if ( function_exists( 'WC' ) && is_user_logged_in() ) {
        if ( null === WC()->customer ) {
            WC()->customer = new WC_Customer( get_current_user_id(), true );
        }
    }

    $ns = 'custom-woo/v1';

    // Register account
    register_rest_route( $ns, '/register', [
        'methods'             => 'POST',
        'callback'            => 'cwoo_register',
        'permission_callback' => '__return_true',
    ] );

    // Customer profile (GET = fetch, PUT = update name/email/displayName)
    register_rest_route( $ns, '/customer', [
        [
            'methods'             => 'GET',
            'callback'            => 'cwoo_get_customer',
            'permission_callback' => 'cwoo_auth_required',
        ],
        [
            'methods'             => 'PUT',
            'callback'            => 'cwoo_update_customer_profile',
            'permission_callback' => 'cwoo_auth_required',
        ],
    ] );

    // Billing + shipping addresses
    register_rest_route( $ns, '/customer/addresses', [
        'methods'             => 'PUT',
        'callback'            => 'cwoo_update_addresses',
        'permission_callback' => 'cwoo_auth_required',
    ] );

    // Orders list
    register_rest_route( $ns, '/orders', [
        'methods'             => 'GET',
        'callback'            => 'cwoo_get_orders',
        'permission_callback' => 'cwoo_auth_required',
    ] );

    // Place order (checkout)
    register_rest_route( $ns, '/checkout', [
        'methods'             => 'POST',
        'callback'            => 'cwoo_checkout',
        'permission_callback' => 'cwoo_auth_required',
    ] );

    // Quote requests (GET = list, POST = create)
    register_rest_route( $ns, '/quotes', [
        [
            'methods'             => 'GET',
            'callback'            => 'cwoo_get_quotes',
            'permission_callback' => 'cwoo_auth_required',
        ],
        [
            'methods'             => 'POST',
            'callback'            => 'cwoo_create_quote',
            'permission_callback' => 'cwoo_auth_required',
        ],
    ] );

    // Dynamic cart totals (subtotal, taxes, fees, shipping, coupons) — public
    register_rest_route( $ns, '/cart-totals', [
        'methods'             => 'POST',
        'callback'            => 'cwoo_cart_totals',
        'permission_callback' => '__return_true',
    ] );

    // Fetch tax & shipping rates config — public (with optional auth token)
    register_rest_route( $ns, '/tax-shipping-config', [
        'methods'             => 'POST',
        'callback'            => 'cwoo_tax_shipping_config',
        'permission_callback' => '__return_true',
    ] );

    // Enabled payment gateways — public
    register_rest_route( $ns, '/payment-gateways', [
        'methods'             => 'GET',
        'callback'            => 'cwoo_payment_gateways',
        'permission_callback' => '__return_true',
    ] );

    // Filtered product listing (category + brand slugs, price, search, sort) —
    // public. The Store API can't filter by the product_brand taxonomy, so this
    // returns Store-API-shaped products with full taxonomy filtering.
    register_rest_route( $ns, '/products', [
        'methods'             => 'GET',
        'callback'            => 'cwoo_filter_products',
        'permission_callback' => '__return_true',
    ] );

    // Order status by id + order key (for the headless thank-you page). Public,
    // but the order key acts as the authorization token.
    register_rest_route( $ns, '/order-status', [
        'methods'             => 'GET',
        'callback'            => 'cwoo_order_status',
        'permission_callback' => '__return_true',
    ] );

}

// ── KILL-SWITCH CHECK ─────────────────────────────────────────
function cwoo_maybe_down() {
    if ( defined( 'CWOO_SIMULATE_DOWN' ) && CWOO_SIMULATE_DOWN ) {
        return new WP_Error( 'service_unavailable', 'API is temporarily unavailable (test mode).', [ 'status' => 503 ] );
    }
    return false;
}

// ── REGISTER ─────────────────────────────────────────────────
function cwoo_register( WP_REST_Request $req ) {
    if ( $err = cwoo_maybe_down() ) return $err;
    $p        = $req->get_json_params();
    $username = sanitize_user( $p['username'] ?? '' );
    $email    = sanitize_email( $p['email'] ?? '' );
    $password = $p['password'] ?? '';

    if ( ! $username || ! $email || ! $password ) {
        return new WP_Error( 'missing_fields', 'Username, email and password are required.', [ 'status' => 400 ] );
    }
    if ( ! is_email( $email ) ) {
        return new WP_Error( 'invalid_email', 'Invalid email address.', [ 'status' => 400 ] );
    }
    if ( username_exists( $username ) ) {
        return new WP_Error( 'username_exists', 'An account with that username already exists.', [ 'status' => 409 ] );
    }
    if ( email_exists( $email ) ) {
        return new WP_Error( 'email_exists', 'An account with that email already exists.', [ 'status' => 409 ] );
    }

    $user_id = wp_create_user( $username, $password, $email );
    if ( is_wp_error( $user_id ) ) {
        return new WP_Error( 'registration_failed', $user_id->get_error_message(), [ 'status' => 500 ] );
    }

    // Create the WooCommerce customer record
    $customer = new WC_Customer( $user_id );
    $customer->save();

    return rest_ensure_response( [
        'id'       => $user_id,
        'username' => $username,
        'email'    => $email,
    ] );
}

// ── GET CUSTOMER ─────────────────────────────────────────────
function cwoo_get_customer( WP_REST_Request $req ) {
    if ( $err = cwoo_maybe_down() ) return $err;
    $uid      = get_current_user_id();
    $user     = get_userdata( $uid );
    $customer = new WC_Customer( $uid );

    return rest_ensure_response( [
        'id'          => $uid,
        'username'    => $user->user_login,
        'email'       => $user->user_email,
        'firstName'   => $user->first_name,
        'lastName'    => $user->last_name,
        'nickname'    => $user->nickname,
        'displayName' => $user->display_name,
        'billing'     => [
            'firstName' => $customer->get_billing_first_name(),
            'lastName'  => $customer->get_billing_last_name(),
            'company'   => $customer->get_billing_company(),
            'address1'  => $customer->get_billing_address_1(),
            'address2'  => $customer->get_billing_address_2(),
            'city'      => $customer->get_billing_city(),
            'state'     => $customer->get_billing_state(),
            'postcode'  => $customer->get_billing_postcode(),
            'country'   => $customer->get_billing_country(),
            'phone'     => $customer->get_billing_phone(),
            'email'     => $customer->get_billing_email(),
        ],
        'shipping'    => [
            'firstName' => $customer->get_shipping_first_name(),
            'lastName'  => $customer->get_shipping_last_name(),
            'company'   => $customer->get_shipping_company(),
            'address1'  => $customer->get_shipping_address_1(),
            'address2'  => $customer->get_shipping_address_2(),
            'city'      => $customer->get_shipping_city(),
            'state'     => $customer->get_shipping_state(),
            'postcode'  => $customer->get_shipping_postcode(),
            'country'   => $customer->get_shipping_country(),
            'phone'     => $customer->get_shipping_phone(),
        ],
    ] );
}

// ── UPDATE PROFILE ───────────────────────────────────────────
function cwoo_update_customer_profile( WP_REST_Request $req ) {
    if ( $err = cwoo_maybe_down() ) return $err;
    $uid    = get_current_user_id();
    $p      = $req->get_json_params();
    $update = [ 'ID' => $uid ];

    if ( isset( $p['firstName'] ) )   $update['first_name']   = sanitize_text_field( $p['firstName'] );
    if ( isset( $p['lastName'] ) )    $update['last_name']    = sanitize_text_field( $p['lastName'] );
    if ( isset( $p['email'] ) )       $update['user_email']   = sanitize_email( $p['email'] );
    if ( isset( $p['displayName'] ) ) $update['display_name'] = sanitize_text_field( $p['displayName'] );

    $result = wp_update_user( $update );
    if ( is_wp_error( $result ) ) {
        return new WP_Error( 'update_failed', $result->get_error_message(), [ 'status' => 500 ] );
    }

    $user = get_userdata( $uid );
    return rest_ensure_response( [
        'firstName'   => $user->first_name,
        'lastName'    => $user->last_name,
        'email'       => $user->user_email,
        'displayName' => $user->display_name,
        'nickname'    => $user->nickname,
    ] );
}

// ── UPDATE ADDRESSES ─────────────────────────────────────────
function cwoo_update_addresses( WP_REST_Request $req ) {
    if ( $err = cwoo_maybe_down() ) return $err;
    $uid      = get_current_user_id();
    $p        = $req->get_json_params();
    $customer = new WC_Customer( $uid );

    if ( ! empty( $p['billing'] ) ) {
        $b = $p['billing'];
        $customer->set_billing_first_name( sanitize_text_field( $b['firstName'] ?? '' ) );
        $customer->set_billing_last_name( sanitize_text_field( $b['lastName'] ?? '' ) );
        $customer->set_billing_company( sanitize_text_field( $b['company'] ?? '' ) );
        $customer->set_billing_address_1( sanitize_text_field( $b['address1'] ?? '' ) );
        $customer->set_billing_address_2( sanitize_text_field( $b['address2'] ?? '' ) );
        $customer->set_billing_city( sanitize_text_field( $b['city'] ?? '' ) );
        $customer->set_billing_state( sanitize_text_field( $b['state'] ?? '' ) );
        $customer->set_billing_postcode( sanitize_text_field( $b['postcode'] ?? '' ) );
        $customer->set_billing_country( sanitize_text_field( $b['country'] ?? '' ) );
        $customer->set_billing_phone( sanitize_text_field( $b['phone'] ?? '' ) );
        $customer->set_billing_email( sanitize_email( $b['email'] ?? '' ) );
    }

    if ( ! empty( $p['shipping'] ) ) {
        $s = $p['shipping'];
        $customer->set_shipping_first_name( sanitize_text_field( $s['firstName'] ?? '' ) );
        $customer->set_shipping_last_name( sanitize_text_field( $s['lastName'] ?? '' ) );
        $customer->set_shipping_company( sanitize_text_field( $s['company'] ?? '' ) );
        $customer->set_shipping_address_1( sanitize_text_field( $s['address1'] ?? '' ) );
        $customer->set_shipping_address_2( sanitize_text_field( $s['address2'] ?? '' ) );
        $customer->set_shipping_city( sanitize_text_field( $s['city'] ?? '' ) );
        $customer->set_shipping_state( sanitize_text_field( $s['state'] ?? '' ) );
        $customer->set_shipping_postcode( sanitize_text_field( $s['postcode'] ?? '' ) );
        $customer->set_shipping_country( sanitize_text_field( $s['country'] ?? '' ) );
        $customer->set_shipping_phone( sanitize_text_field( $s['phone'] ?? '' ) );
    }

    $customer->save();
    return rest_ensure_response( [ 'success' => true ] );
}

// ── GET ORDERS ───────────────────────────────────────────────
function cwoo_get_orders( WP_REST_Request $req ) {
    if ( $err = cwoo_maybe_down() ) return $err;
    $uid    = get_current_user_id();
    $orders = wc_get_orders( [
        'customer_id' => $uid,
        'limit'       => 50,
        'orderby'     => 'date',
        'order'       => 'DESC',
        'status'      => array_keys( wc_get_order_statuses() ),
    ] );

    $result = [];
    $symbol = html_entity_decode( get_woocommerce_currency_symbol(), ENT_QUOTES | ENT_HTML5 );

    foreach ( $orders as $order ) {
        $items = [];
        foreach ( $order->get_items() as $item ) {
            $items[] = [
                'name'     => $item->get_name(),
                'quantity' => $item->get_quantity(),
                'total'    => $symbol . number_format( (float) $item->get_total(), 2 ),
            ];
        }

        $created    = $order->get_date_created();
        $result[]   = [
            'id'                 => $order->get_id(),
            'databaseId'         => $order->get_id(),
            'orderNumber'        => $order->get_order_number(),
            'date'               => $created ? $created->format( 'Y-m-d\TH:i:s' ) : '',
            'status'             => strtoupper( $order->get_status() ),
            'total'              => $symbol . number_format( (float) $order->get_total(), 2 ),
            'currency'           => $order->get_currency(),
            'needsPayment'       => (bool) $order->needs_payment(),
            'paymentUrl'         => $order->needs_payment() ? add_query_arg( 'ref', CWOO_PAY_REF, $order->get_checkout_payment_url() ) : '',
            'paymentMethodTitle' => $order->get_payment_method_title(),
            'billing'            => [
                'firstName' => $order->get_billing_first_name(),
                'lastName'  => $order->get_billing_last_name(),
                'company'   => $order->get_billing_company(),
                'address1'  => $order->get_billing_address_1(),
                'address2'  => $order->get_billing_address_2(),
                'city'      => $order->get_billing_city(),
                'state'     => $order->get_billing_state(),
                'postcode'  => $order->get_billing_postcode(),
                'country'   => $order->get_billing_country(),
                'email'     => $order->get_billing_email(),
                'phone'     => $order->get_billing_phone(),
            ],
            'shipping'           => [
                'firstName' => $order->get_shipping_first_name(),
                'lastName'  => $order->get_shipping_last_name(),
                'company'   => $order->get_shipping_company(),
                'address1'  => $order->get_shipping_address_1(),
                'address2'  => $order->get_shipping_address_2(),
                'city'      => $order->get_shipping_city(),
                'state'     => $order->get_shipping_state(),
                'postcode'  => $order->get_shipping_postcode(),
                'country'   => $order->get_shipping_country(),
            ],
            'items'              => $items,
        ];
    }

    return rest_ensure_response( $result );
}

// ── CHECKOUT / PLACE ORDER ───────────────────────────────────
function cwoo_checkout( WP_REST_Request $req ) {
    if ( $err = cwoo_maybe_down() ) return $err;
    $uid = get_current_user_id();
    $p   = $req->get_json_params();

    if ( empty( $p['billing'] ) || empty( $p['line_items'] ) ) {
        return new WP_Error( 'missing_data', 'Billing and line_items are required.', [ 'status' => 400 ] );
    }

    // WooCommerce needs a session + customer for tax/shipping in REST context.
    if ( function_exists( 'WC' ) ) {
        if ( null === WC()->session ) {
            WC()->initialize_session();
        }
        if ( null === WC()->customer ) {
            WC()->customer = new WC_Customer( $uid, true );
        }
    }

    // Create the order using WooCommerce default function
    $order = wc_create_order( [ 'customer_id' => $uid ] );
    if ( is_wp_error( $order ) ) {
        return new WP_Error( 'order_failed', $order->get_error_message(), [ 'status' => 500 ] );
    }

    // Add products — uses wc_get_product so all WC restrictions apply
    $has_items = false;
    foreach ( (array) $p['line_items'] as $line ) {
        $product_id = absint( $line['product_id'] ?? 0 );
        $qty        = absint( $line['quantity'] ?? 1 );
        if ( ! $product_id || ! $qty ) continue;

        $product = wc_get_product( $product_id );
        if ( ! $product ) continue;

        // Respect WooCommerce purchase restrictions
        if ( ! $product->is_purchasable() ) {
            $order->delete( true );
            return new WP_Error(
                'not_purchasable',
                sprintf( '"%s" is not available for purchase.', $product->get_name() ),
                [ 'status' => 403 ]
            );
        }

        // Stock check
        if ( ! $product->is_in_stock() ) {
            $order->delete( true );
            return new WP_Error(
                'out_of_stock',
                sprintf( '"%s" is out of stock.', $product->get_name() ),
                [ 'status' => 400 ]
            );
        }

        $order->add_product( $product, $qty );
        $has_items = true;
    }

    if ( ! $has_items ) {
        $order->delete( true );
        return new WP_Error( 'no_items', 'No valid products found in order.', [ 'status' => 400 ] );
    }

    // Billing address
    $b = $p['billing'];
    $order->set_address( [
        'first_name' => sanitize_text_field( $b['firstName'] ?? '' ),
        'last_name'  => sanitize_text_field( $b['lastName'] ?? '' ),
        'company'    => sanitize_text_field( $b['company'] ?? '' ),
        'address_1'  => sanitize_text_field( $b['address1'] ?? '' ),
        'address_2'  => sanitize_text_field( $b['address2'] ?? '' ),
        'city'       => sanitize_text_field( $b['city'] ?? '' ),
        'state'      => sanitize_text_field( $b['state'] ?? '' ),
        'postcode'   => sanitize_text_field( $b['postcode'] ?? '' ),
        'country'    => sanitize_text_field( $b['country'] ?? '' ),
        'email'      => sanitize_email( $b['email'] ?? '' ),
        'phone'      => sanitize_text_field( $b['phone'] ?? '' ),
    ], 'billing' );

    // Shipping address (use billing if not shipping to different)
    $s = ( ! empty( $p['ship_to_different'] ) && ! empty( $p['shipping'] ) ) ? $p['shipping'] : $b;
    $order->set_address( [
        'first_name' => sanitize_text_field( $s['firstName'] ?? '' ),
        'last_name'  => sanitize_text_field( $s['lastName'] ?? '' ),
        'company'    => sanitize_text_field( $s['company'] ?? '' ),
        'address_1'  => sanitize_text_field( $s['address1'] ?? '' ),
        'address_2'  => sanitize_text_field( $s['address2'] ?? '' ),
        'city'       => sanitize_text_field( $s['city'] ?? '' ),
        'state'      => sanitize_text_field( $s['state'] ?? '' ),
        'postcode'   => sanitize_text_field( $s['postcode'] ?? '' ),
        'country'    => sanitize_text_field( $s['country'] ?? '' ),
        'phone'      => sanitize_text_field( $s['phone'] ?? '' ),
    ], 'shipping' );

    // Payment
    $order->set_payment_method( sanitize_text_field( $p['payment_method'] ?? 'cheque' ) );
    $order->set_payment_method_title( sanitize_text_field( $p['payment_method_title'] ?? '' ) );

    // Customer note
    if ( ! empty( $p['customer_note'] ) ) {
        $order->set_customer_note( sanitize_textarea_field( $p['customer_note'] ) );
    }

    // Shipping — populate the real WC()->cart so custom shipping methods that
    // read WC()->cart->get_cart() (e.g. "Dazed Shipping Charge") calculate
    // correctly, then attach the first available rate to the order.
    if ( class_exists( 'WC_Shipping' ) ) {
        try {
            if ( null === WC()->cart ) {
                wc_load_cart();
            }
            $cart = WC()->cart;
            $cart->empty_cart( false );

            WC()->customer->set_shipping_country( sanitize_text_field( $s['country'] ?? '' ) );
            WC()->customer->set_shipping_state( sanitize_text_field( $s['state'] ?? '' ) );
            WC()->customer->set_shipping_postcode( sanitize_text_field( $s['postcode'] ?? '' ) );
            WC()->customer->set_shipping_city( sanitize_text_field( $s['city'] ?? '' ) );

            foreach ( $order->get_items() as $order_item ) {
                $prod = $order_item->get_product();
                if ( $prod ) {
                    $cart->add_to_cart( $prod->get_id(), $order_item->get_quantity() );
                }
            }

            $cart->calculate_shipping();
            $packages = $cart->get_shipping_packages();
            $calc     = WC()->shipping()->calculate_shipping( $packages );

            if ( ! empty( $calc[0]['rates'] ) ) {
                $selected_shipping_method = sanitize_text_field( $p['shippingMethodId'] ?? $p['shipping_method'] ?? '' );
                $chosen_rate = null;
                if ( $selected_shipping_method ) {
                    foreach ( $calc[0]['rates'] as $rate ) {
                        if ( $rate->get_id() === $selected_shipping_method ) {
                            $chosen_rate = $rate;
                            break;
                        }
                    }
                }
                if ( ! $chosen_rate ) {
                    $chosen_rate = reset( $calc[0]['rates'] );
                }

                $ship_item = new WC_Order_Item_Shipping();
                $ship_item->set_shipping_rate( $chosen_rate );
                $order->add_item( $ship_item );
            }

            $cart->empty_cart( false );
        } catch ( \Throwable $e ) {
            // shipping unavailable — proceed without a shipping line
        }
    }

    // Coupons — accept either a single coupon_code or a coupons[] array.
    $coupon_codes = [];
    if ( ! empty( $p['coupons'] ) && is_array( $p['coupons'] ) ) {
        $coupon_codes = $p['coupons'];
    } elseif ( ! empty( $p['coupon_code'] ) ) {
        $coupon_codes = [ $p['coupon_code'] ];
    }

    // Apply custom user-based state-wise excise tax fee
    $billing_state = strtoupper( $order->get_billing_state() );
    $excise_enabled = get_field('enable_excise_tax', 'user_' . $uid) ? true : false;
    if ( $excise_enabled && $billing_state ) {
        $total_excise_tax = 0;
        foreach ( $order->get_items() as $item ) {
            $product = $item->get_product();
            if ( ! $product ) continue;
            switch ( $billing_state ) {
                case 'KY':
                    $excise_price = get_post_meta( $product->get_id(), 'excise_tax_kentucky', true );
                    break;
                case 'OH':
                    $excise_price = get_post_meta( $product->get_id(), 'excise_tax_ohio', true );
                    break;
                case 'WV':
                    $excise_price = get_post_meta( $product->get_id(), 'excise_tax_west_virginia', true );
                    break;
                default:
                    $excise_price = 0;
            }
            if ( $excise_price ) {
                $total_excise_tax += (float)$excise_price * $item->get_quantity();
            }
        }
        if ( $total_excise_tax > 0 ) {
            $fee_item = new WC_Order_Item_Fee();
            $fee_item->set_name( $billing_state . ' Excise Tax' );
            $fee_item->set_total( $total_excise_tax );
            $fee_item->set_taxes( [] );
            $order->add_item( $fee_item );
        }
    }

    foreach ( $coupon_codes as $raw_code ) {
        $code = wc_format_coupon_code( sanitize_text_field( $raw_code ) );
        if ( ! $code ) continue;
        try {
            $applied = $order->apply_coupon( $code );
            if ( is_wp_error( $applied ) ) {
                $order->delete( true );
                return new WP_Error( 'invalid_coupon', wp_strip_all_tags( $applied->get_error_message() ), [ 'status' => 400 ] );
            }
        } catch ( \Throwable $e ) {
            $order->delete( true );
            return new WP_Error( 'invalid_coupon', 'A coupon could not be applied.', [ 'status' => 400 ] );
        }
    }

    // WooCommerce calculates tax, coupons, totals
    $order->calculate_totals();

    // Offline / no-input methods (charge-on-file, pay-through-rep, bank transfer)
    // don't need the order-pay page — finalise the order right away with a real
    // status instead of "Pending payment". Gateways that collect card/eCheck
    // details stay "pending" so the customer completes them on the pay page.
    $offline_methods = apply_filters( 'cwoo_offline_payment_methods', [ 'cheque', 'cod', 'bacs', 'rep' ] );
    $pm              = $order->get_payment_method();
    $is_offline      = in_array( $pm, (array) $offline_methods, true );

    if ( $is_offline ) {
        $order->update_status( 'on-hold', 'Offline payment method selected via storefront.' );
    } else {
        $order->update_status( 'pending', 'Order placed via storefront.' );
    }
    $order->save();

    // Admin "new order" email always; for offline orders also send the customer
    // an on-hold confirmation now (there's no pay-page step for them).
    WC()->mailer()->emails['WC_Email_New_Order']->trigger( $order->get_id() );
    if ( $is_offline && isset( WC()->mailer()->emails['WC_Email_Customer_On_Hold_Order'] ) ) {
        WC()->mailer()->emails['WC_Email_Customer_On_Hold_Order']->trigger( $order->get_id() );
    }

    $sym     = html_entity_decode( get_woocommerce_currency_symbol(), ENT_QUOTES | ENT_HTML5 );
    $created = $order->get_date_created();

    // Only non-offline methods hand off to the order-pay page. The URL carries
    // the order key (guest-payable) + ref marker for the themed pay UI.
    $needs_payment = ! $is_offline && $order->needs_payment();
    $payment_url   = $needs_payment
        ? add_query_arg( 'ref', CWOO_PAY_REF, $order->get_checkout_payment_url() )
        : '';

    return rest_ensure_response( [
        'orderId'      => $order->get_id(),
        'orderNumber'  => $order->get_order_number(),
        'orderKey'     => $order->get_order_key(),
        'status'       => strtoupper( $order->get_status() ),
        'total'        => $sym . number_format( (float) $order->get_total(), 2 ),
        'date'         => $created ? $created->format( 'Y-m-d\TH:i:s' ) : '',
        'needsPayment' => (bool) $needs_payment,
        'paymentUrl'   => $payment_url,
    ] );
}



// ── QUOTE REQUESTS ────────────────────────────────────────────
function cwoo_get_quotes( WP_REST_Request $req ) {
    if ( $err = cwoo_maybe_down() ) return $err;
    $uid = get_current_user_id();
    $posts = get_posts( [
        'post_type'      => 'cwoo_quote',
        'author'         => $uid,
        'posts_per_page' => 50,
        'orderby'        => 'date',
        'order'          => 'DESC',
        'post_status'    => [ 'publish', 'pending', 'private' ],
    ] );
    $result = [];
    foreach ( $posts as $post ) {
        $result[] = [
            'id'             => $post->ID,
            'date'           => $post->post_date,
            'status'         => get_post_meta( $post->ID, '_quote_status', true ) ?: 'pending',
            'product_name'   => get_post_meta( $post->ID, '_quote_product', true ),
            'quantity'       => (int) get_post_meta( $post->ID, '_quote_qty', true ),
            'notes'          => $post->post_content,
            'admin_response' => get_post_meta( $post->ID, '_quote_response', true ),
        ];
    }
    return rest_ensure_response( $result );
}

function cwoo_create_quote( WP_REST_Request $req ) {
    if ( $err = cwoo_maybe_down() ) return $err;
    $uid  = get_current_user_id();
    $p    = $req->get_json_params();
    $name = sanitize_text_field( $p['product_name'] ?? '' );
    $qty  = absint( $p['quantity'] ?? 1 );
    $note = sanitize_textarea_field( $p['notes'] ?? '' );

    if ( ! $name ) {
        return new WP_Error( 'missing_product', 'product_name is required.', [ 'status' => 400 ] );
    }

    $post_id = wp_insert_post( [
        'post_type'    => 'cwoo_quote',
        'post_title'   => "Quote: {$name} x{$qty} — " . get_the_author_meta( 'display_name', $uid ),
        'post_content' => $note,
        'post_status'  => 'private',
        'post_author'  => $uid,
    ], true );

    if ( is_wp_error( $post_id ) ) {
        return new WP_Error( 'create_failed', $post_id->get_error_message(), [ 'status' => 500 ] );
    }

    update_post_meta( $post_id, '_quote_product', $name );
    update_post_meta( $post_id, '_quote_qty', $qty );
    update_post_meta( $post_id, '_quote_status', 'pending' );

    // Notify admin
    $admin_email = get_option( 'admin_email' );
    $user        = get_userdata( $uid );
    wp_mail(
        $admin_email,
        "New Quote Request: {$name}",
        "User: {$user->display_name} ({$user->user_email})\nProduct: {$name}\nQty: {$qty}\nNotes: {$note}\n\nManage: " . admin_url( "post.php?post={$post_id}&action=edit" )
    );

    return rest_ensure_response( [ 'id' => $post_id ] );
}

// ── DYNAMIC CART TOTALS ───────────────────────────────────────
// Builds a temporary draft order (the same mechanism the /checkout
// endpoint uses, which works reliably headless) so tax rates, tax
// classes, shipping zones/methods, fees and coupons all resolve exactly
// as they would on the WooCommerce storefront. The order is deleted at
// the end — nothing is persisted.
function cwoo_cart_totals( WP_REST_Request $req ) {
    if ( $err = cwoo_maybe_down() ) return $err;
    if ( ! function_exists( 'WC' ) ) {
        return new WP_Error( 'no_wc', 'WooCommerce not available.', [ 'status' => 500 ] );
    }

    $p       = $req->get_json_params();
    $items   = isset( $p['line_items'] ) && is_array( $p['line_items'] ) ? $p['line_items'] : [];
    $coupons = [];
    if ( ! empty( $p['coupons'] ) && is_array( $p['coupons'] ) ) {
        $coupons = $p['coupons'];
    } elseif ( ! empty( $p['coupon_code'] ) ) {
        $coupons = [ $p['coupon_code'] ];
    }
    $dest = isset( $p['destination'] ) && is_array( $p['destination'] ) ? $p['destination'] : [];
    $uid  = get_current_user_id();

    $sym = html_entity_decode( get_woocommerce_currency_symbol(), ENT_QUOTES | ENT_HTML5 );
    $fmt = function ( $v ) use ( $sym ) {
        return $sym . number_format( (float) $v, 2 );
    };

    // Session + customer are needed for tax/shipping resolution.
    if ( null === WC()->session ) {
        WC()->initialize_session();
    }
    if ( null === WC()->customer ) {
        WC()->customer = new WC_Customer( $uid, true );
    }

    $country  = sanitize_text_field( $dest['country'] ?? '' );
    $state    = sanitize_text_field( $dest['state'] ?? '' );
    $postcode = sanitize_text_field( $dest['postcode'] ?? '' );
    $city     = sanitize_text_field( $dest['city'] ?? '' );

    // Draft order.
    $order = wc_create_order( [ 'customer_id' => $uid ] );
    if ( is_wp_error( $order ) ) {
        return new WP_Error( 'order_failed', 'Could not calculate totals.', [ 'status' => 500 ] );
    }

    $ship_contents = [];
    $ship_subtotal = 0;
    foreach ( $items as $line ) {
        $pid = absint( $line['product_id'] ?? 0 );
        $qty = absint( $line['quantity'] ?? 1 );
        if ( ! $pid || ! $qty ) continue;
        $product = wc_get_product( $pid );
        if ( ! $product ) continue;
        $order->add_product( $product, $qty );
        $ship_contents[] = [ 'data' => $product, 'quantity' => $qty ];
        $ship_subtotal  += (float) $product->get_price() * $qty;
    }

    // Address drives tax.
    if ( $country ) {
        $addr = [
            'country'  => $country,
            'state'    => $state,
            'postcode' => $postcode,
            'city'     => $city,
        ];
        $order->set_address( $addr, 'billing' );
        $order->set_address( $addr, 'shipping' );
    }

    // Shipping — many custom shipping methods (e.g. "Dazed Shipping Charge")
    // read WC()->cart->get_cart() directly inside calculate_shipping(), so we
    // must populate the real cart, not just build a package array.
    $shipping_methods = [];
    if ( ! empty( $ship_contents ) && class_exists( 'WC_Shipping' ) ) {
        try {
            if ( null === WC()->cart ) {
                wc_load_cart();
            }
            $cart = WC()->cart;
            $cart->empty_cart( false );

            // Destination on the customer so zone matching + address-based
            // methods resolve correctly.
            if ( $country ) {
                WC()->customer->set_shipping_country( $country );
                WC()->customer->set_shipping_state( $state );
                WC()->customer->set_shipping_postcode( $postcode );
                WC()->customer->set_shipping_city( $city );
            }

            foreach ( $items as $line ) {
                $pid = absint( $line['product_id'] ?? 0 );
                $qty = absint( $line['quantity'] ?? 1 );
                if ( $pid && $qty ) {
                    $cart->add_to_cart( $pid, $qty );
                }
            }

            $cart->calculate_shipping();
            $packages = $cart->get_shipping_packages();
            $calc     = WC()->shipping()->calculate_shipping( $packages );

            if ( ! empty( $calc[0]['rates'] ) ) {
                foreach ( $calc[0]['rates'] as $rate ) {
                    $shipping_methods[] = [
                        'id'            => $rate->get_id(),
                        'label'         => $rate->get_label(),
                        'cost'          => (float) $rate->get_cost(),
                        'costFormatted' => $fmt( $rate->get_cost() ),
                    ];
                }
                $rate      = reset( $calc[0]['rates'] );
                $ship_item = new WC_Order_Item_Shipping();
                $ship_item->set_shipping_rate( $rate );
                $order->add_item( $ship_item );
            }

            $cart->empty_cart( false );
        } catch ( \Throwable $e ) {
            // shipping unavailable — proceed without a shipping line
        }
    }

    // Coupons — collect validation errors instead of aborting.
    $coupon_errors = [];
    foreach ( $coupons as $raw ) {
        $code = wc_format_coupon_code( sanitize_text_field( $raw ) );
        if ( ! $code ) continue;
        try {
            $applied = $order->apply_coupon( $code );
            if ( is_wp_error( $applied ) ) {
                $coupon_errors[] = [ 'code' => $code, 'message' => wp_strip_all_tags( $applied->get_error_message() ) ];
            }
        } catch ( \Throwable $e ) {
            $coupon_errors[] = [ 'code' => $code, 'message' => 'Coupon could not be applied.' ];
        }
    }

    $order->calculate_totals();

    // Fee lines.
    $fees = [];
    foreach ( $order->get_items( 'fee' ) as $fee ) {
        $fees[] = [
            'name'           => $fee->get_name(),
            'total'          => (float) $fee->get_total(),
            'totalFormatted' => $fmt( $fee->get_total() ),
        ];
    }

    // Tax lines (itemised, e.g. "OH Sales Tax", "County Tax").
    $tax_lines = [];
    foreach ( $order->get_items( 'tax' ) as $tax ) {
        $amount = (float) $tax->get_tax_total() + (float) $tax->get_shipping_tax_total();
        $tax_lines[] = [
            'label'          => $tax->get_label(),
            'total'          => $amount,
            'totalFormatted' => $fmt( $amount ),
        ];
    }

    // Applied coupons.
    $applied_coupons = [];
    foreach ( $order->get_items( 'coupon' ) as $coupon ) {
        $applied_coupons[] = [
            'code'              => $coupon->get_code(),
            'discount'          => (float) $coupon->get_discount(),
            'discountFormatted' => $fmt( $coupon->get_discount() ),
        ];
    }

    $subtotal     = (float) $order->get_subtotal();
    $discount     = (float) $order->get_discount_total();
    $shipping_tot = (float) $order->get_shipping_total();
    $fee_total    = (float) $order->get_total_fees();
    $tax_total    = (float) $order->get_total_tax();
    $grand_total  = (float) $order->get_total();

    $response = [
        'currencySymbol'    => $sym,
        'subtotal'          => $subtotal,
        'subtotalFormatted' => $fmt( $subtotal ),
        'discountTotal'     => $discount,
        'discountFormatted' => $fmt( $discount ),
        'shippingTotal'     => $shipping_tot,
        'shippingFormatted' => $fmt( $shipping_tot ),
        'shippingMethods'   => $shipping_methods,
        'feeTotal'          => $fee_total,
        'fees'              => $fees,
        'taxTotal'          => $tax_total,
        'taxFormatted'      => $fmt( $tax_total ),
        'taxLines'          => $tax_lines,
        'total'             => $grand_total,
        'totalFormatted'    => $fmt( $grand_total ),
        'appliedCoupons'    => $applied_coupons,
        'couponErrors'      => $coupon_errors,
    ];

    // Discard the scratch order — never persisted.
    $order->delete( true );

    return rest_ensure_response( $response );
}

// ── GET STATE TAX RATES HELPER ────────────────────────────────
function cwoo_get_state_tax_rates( $state, $user_id, $postcode = '', $city = '', $country = 'US' ) {
    $sales_enabled = get_field('enable_sales_tax', 'user_' . $user_id) ? true : false;

    $rates = [];
    if ( $sales_enabled && $state ) {
        $state = strtoupper( $state );
        $country = strtoupper( $country ?: 'US' );
        $found_rates = WC_Tax::find_rates([
            'country' => $country,
            'state' => $state,
            'postcode' => $postcode,
            'city' => $city,
            'tax_class' => '',
        ]);
        
        if ( empty( $found_rates ) ) {
            global $wpdb;
            $table_name = $wpdb->prefix . 'woocommerce_tax_rates';
            $db_rates = $wpdb->get_results( $wpdb->prepare(
                "SELECT tax_rate, tax_rate_name FROM {$table_name} 
                 WHERE (tax_rate_state = %s OR tax_rate_state = '') 
                 AND tax_rate_country = %s 
                 AND tax_rate_class = '' 
                 ORDER BY tax_rate_priority ASC",
                $state,
                $country
            ) );
            
            if ( ! empty( $db_rates ) ) {
                foreach ( $db_rates as $row ) {
                    $label = $row->tax_rate_name;
                    if ( $label === 'Tax' || !$label ) {
                        $label = $state . ' Sales Tax';
                    } else {
                        if ( strpos( strtoupper($label), $state ) === false ) {
                            $label = $state . ' ' . $label;
                        }
                    }
                    $rates[] = [
                        'type'  => 'sales',
                        'label' => $label,
                        'rate'  => (float)$row->tax_rate / 100.0,
                    ];
                }
            }
        } else {
            foreach ( $found_rates as $rate_id => $rate_info ) {
                $label = $rate_info['label'];
                if ( $label === 'Tax' || !$label ) {
                    $label = $state . ' Sales Tax';
                } else {
                    if ( strpos( strtoupper($label), $state ) === false ) {
                        $label = $state . ' ' . $label;
                    }
                }
                $rates[] = [
                    'type'  => 'sales',
                    'label' => $label,
                    'rate'  => (float)$rate_info['rate'] / 100.0,
                ];
            }
        }
    }

    return $rates;
}

// ── TAX AND SHIPPING CONFIG ENDPOINT ──────────────────────────
function cwoo_tax_shipping_config( WP_REST_Request $req ) {
    if ( $err = cwoo_maybe_down() ) return $err;
    if ( ! function_exists( 'WC' ) ) {
        return new WP_Error( 'no_wc', 'WooCommerce not available.', [ 'status' => 500 ] );
    }

    $p       = $req->get_json_params();
    $items   = isset( $p['line_items'] ) && is_array( $p['line_items'] ) ? $p['line_items'] : [];
    $dest    = isset( $p['destination'] ) && is_array( $p['destination'] ) ? $p['destination'] : [];
    $coupons = isset( $p['coupons'] ) && is_array( $p['coupons'] ) ? $p['coupons'] : [];
    $uid     = get_current_user_id();

    $country  = sanitize_text_field( $dest['country'] ?? '' );
    $state    = sanitize_text_field( $dest['state'] ?? '' );
    $postcode = sanitize_text_field( $dest['postcode'] ?? '' );
    $city     = sanitize_text_field( $dest['city'] ?? '' );

    // Fallback to customer default profile address if not provided in request
    if ( ! $state && $uid ) {
        $customer = new WC_Customer( $uid );
        $state = $customer->get_shipping_state() ?: $customer->get_billing_state();
        $country = $customer->get_shipping_country() ?: $customer->get_billing_country();
        $postcode = $customer->get_shipping_postcode() ?: $customer->get_billing_postcode();
        $city = $customer->get_shipping_city() ?: $customer->get_billing_city();
    }

    // Fallback to WooCommerce base store location if still empty
    if ( ! $state ) {
        if ( class_exists('WC') && null !== WC()->countries ) {
            $state = WC()->countries->get_base_state();
            $country = WC()->countries->get_base_country();
        }
    }

    // Fetch tax rates for the state & user
    $tax_rates = cwoo_get_state_tax_rates( $state, $uid, $postcode, $city, $country );

    // ── Excise tax as PER-PRODUCT unit amounts ────────────────
    // Returned so the frontend can compute excise = Σ(unit × qty)
    // instantly on quantity/item changes — no dependence on the WC
    // session/customer state (which was the cause of the stale-fee bug).
    $excise_enabled     = get_field( 'enable_excise_tax', 'user_' . $uid ) ? true : false;
    $excise_per_product = [];
    $excise_label       = $state ? ( strtoupper( $state ) . ' Excise Tax' ) : 'Excise Tax';
    if ( $excise_enabled && $state ) {
        $meta_key = '';
        switch ( strtoupper( $state ) ) {
            case 'KY': $meta_key = 'excise_tax_kentucky';       break;
            case 'OH': $meta_key = 'excise_tax_ohio';           break;
            case 'WV': $meta_key = 'excise_tax_west_virginia';  break;
        }
        if ( $meta_key ) {
            foreach ( $items as $line ) {
                $pid = absint( $line['product_id'] ?? 0 );
                if ( ! $pid ) continue;
                $unit = get_post_meta( $pid, $meta_key, true );
                if ( $unit && (float) $unit > 0 ) {
                    $excise_per_product[ (string) $pid ] = (float) $unit;
                }
            }
        }
    }

    // Fetch shipping methods
    $shipping_methods = [];
    $sym = html_entity_decode( get_woocommerce_currency_symbol(), ENT_QUOTES | ENT_HTML5 );
    $fmt = function ( $v ) use ( $sym ) {
        return $sym . number_format( (float) $v, 2 );
    };

    global $cwoo_temp_cart_items;
    $cwoo_temp_cart_items = [];
    if ( ! empty( $items ) && class_exists( 'WC_Shipping' ) ) {
        try {
            if ( null === WC()->session ) {
                WC()->initialize_session();
            }
            if ( null === WC()->customer ) {
                WC()->customer = new WC_Customer( $uid, true );
            }
            if ( null === WC()->cart ) {
                wc_load_cart();
            }
            $cart = WC()->cart;

            foreach ( $items as $line ) {
                $pid = absint( $line['product_id'] ?? 0 );
                $qty = absint( $line['quantity'] ?? 1 );
                if ( ! $pid || ! $qty ) continue;
                $product = wc_get_product( $pid );
                if ( ! $product ) continue;
                $cart_item_key = $cart->generate_cart_id( $pid );
                $cwoo_temp_cart_items[ $cart_item_key ] = [
                    'key'          => $cart_item_key,
                    'product_id'   => $pid,
                    'variation_id' => 0,
                    'variation'    => [],
                    'quantity'     => $qty,
                    'data'         => $product,
                ];
            }

            // Directly overwrite cart contents in memory to bypass WooCommerce internal cache
            $cart->cart_contents = $cwoo_temp_cart_items;

            // Override WooCommerce session cart temporarily
            add_filter( 'woocommerce_get_cart_contents', 'cwoo_override_cart_contents_temp' );

            if ( $country ) {
                WC()->customer->set_shipping_country( $country );
                WC()->customer->set_shipping_state( $state );
                WC()->customer->set_shipping_postcode( $postcode );
                WC()->customer->set_shipping_city( $city );
            }

            $cart->calculate_shipping();
            $packages = $cart->get_shipping_packages();
            $calc     = WC()->shipping()->calculate_shipping( $packages );

            if ( ! empty( $calc[0]['rates'] ) ) {
                foreach ( $calc[0]['rates'] as $rate ) {
                    $shipping_methods[] = [
                        'id'            => $rate->get_id(),
                        'label'         => $rate->get_label(),
                        'cost'          => (float) $rate->get_cost(),
                        'costFormatted' => $fmt( $rate->get_cost() ),
                    ];
                }
            }

            $applied_coupons = [];
            $coupon_errors   = [];
            foreach ( $coupons as $raw ) {
                $code = wc_format_coupon_code( sanitize_text_field( $raw ) );
                if ( ! $code ) continue;
                if ( ! $cart->has_discount( $code ) ) {
                    try {
                        // WC_Cart::apply_coupon() returns a bool and pushes the
                        // real reason into WooCommerce error notices — capture it.
                        wc_clear_notices();
                        $applied = $cart->apply_coupon( $code );
                        if ( ! $applied ) {
                            $notices = wc_get_notices( 'error' );
                            $msg = ! empty( $notices )
                                ? wp_strip_all_tags( $notices[ count( $notices ) - 1 ]['notice'] )
                                : 'This coupon is not applicable to your cart.';
                            $coupon_errors[] = [
                                'code'    => $raw,
                                'message' => $msg,
                            ];
                        }
                        wc_clear_notices();
                    } catch ( \Throwable $e ) {
                        $coupon_errors[] = [
                            'code'    => $raw,
                            'message' => wp_strip_all_tags( $e->getMessage() ),
                        ];
                    }
                }
            }

            $cart->calculate_fees();
            $cart->calculate_totals();

            foreach ( $cart->get_applied_coupons() as $coupon_code ) {
                $discount = $cart->get_coupon_discount_amount( $coupon_code );
                $applied_coupons[] = [
                    'code'              => $coupon_code,
                    'discount'          => (float) $discount,
                    'discountFormatted' => $fmt( $discount ),
                ];
            }

            $fees_list = [];
            foreach ( $cart->get_fees() as $fee ) {
                // Excise is returned as per-product unit amounts and computed
                // on the frontend — skip the cart-hook version to avoid double
                // counting.
                if ( stripos( $fee->name, 'excise' ) !== false ) continue;
                $fees_list[] = [
                    'name'           => $fee->name,
                    'total'          => (float) $fee->amount,
                    'totalFormatted' => $fmt( $fee->amount ),
                ];
            }

            remove_filter( 'woocommerce_get_cart_contents', 'cwoo_override_cart_contents_temp' );
            unset( $GLOBALS['cwoo_temp_cart_items'] );
        } catch ( \Throwable $e ) {
            remove_filter( 'woocommerce_get_cart_contents', 'cwoo_override_cart_contents_temp' );
            unset( $GLOBALS['cwoo_temp_cart_items'] );
        }
    }

    return rest_ensure_response( [
        'state'            => $state,
        'taxRates'         => $tax_rates,
        'shippingMethods'  => $shipping_methods,
        'fees'             => isset($fees_list) ? $fees_list : [],
        'exciseEnabled'    => $excise_enabled,
        'exciseLabel'      => $excise_label,
        'excisePerProduct' => (object) $excise_per_product,
        'appliedCoupons'   => isset($applied_coupons) ? $applied_coupons : [],
        'couponErrors'     => isset($coupon_errors) ? $coupon_errors : [],
    ] );
}

// ── PAYMENT GATEWAYS ──────────────────────────────────────────
function cwoo_payment_gateways( WP_REST_Request $req ) {
    if ( $err = cwoo_maybe_down() ) return $err;
    if ( ! function_exists( 'WC' ) ) {
        return new WP_Error( 'no_wc', 'WooCommerce not available.', [ 'status' => 500 ] );
    }

    $gateways = WC()->payment_gateways()->get_available_payment_gateways();
    $out = [];
    foreach ( $gateways as $gw ) {
        $out[] = [
            'id'          => $gw->id,
            'title'       => wp_strip_all_tags( $gw->get_title() ),
            'description' => wp_strip_all_tags( $gw->get_description() ),
            'order'       => (int) ( $gw->settings['order'] ?? 0 ),
        ];
    }

    return rest_ensure_response( $out );
}

// ── FILTERED PRODUCTS (category + brand slugs) ───────────────
function cwoo_map_store_product( $product ) {
    $minor  = wc_get_price_decimals();
    $factor = pow( 10, $minor );
    $to_minor = function ( $v ) use ( $factor ) {
        if ( $v === '' || $v === null ) return '';
        return (string) round( (float) $v * $factor );
    };

    $images = [];
    $ids    = array_filter( array_merge( [ $product->get_image_id() ], $product->get_gallery_image_ids() ) );
    foreach ( $ids as $img_id ) {
        $full  = wp_get_attachment_image_url( $img_id, 'full' );
        if ( ! $full ) continue;
        $thumb = wp_get_attachment_image_url( $img_id, 'woocommerce_thumbnail' );
        $images[] = [
            'id'        => (int) $img_id,
            'src'       => $full,
            'thumbnail' => $thumb ?: $full,
            'alt'       => get_post_meta( $img_id, '_wp_attachment_image_alt', true ) ?: $product->get_name(),
        ];
    }

    $cats = [];
    $terms = get_the_terms( $product->get_id(), 'product_cat' );
    if ( is_array( $terms ) ) {
        foreach ( $terms as $term ) {
            $cats[] = [
                'id'        => $term->term_id,
                'name'      => $term->name,
                'slug'      => $term->slug,
                'count'     => (int) $term->count,
                'image'     => null,
                'permalink' => '',
            ];
        }
    }

    $symbol = html_entity_decode( get_woocommerce_currency_symbol(), ENT_QUOTES | ENT_HTML5 );

    return [
        'id'                => $product->get_id(),
        'name'              => $product->get_name(),
        'slug'              => $product->get_slug(),
        'permalink'         => get_permalink( $product->get_id() ),
        'sku'               => $product->get_sku(),
        'short_description' => $product->get_short_description(),
        'description'       => $product->get_description(),
        'on_sale'           => $product->is_on_sale(),
        'images'            => $images,
        'categories'        => $cats,
        'average_rating'    => (string) $product->get_average_rating(),
        'review_count'      => (int) $product->get_review_count(),
        'is_in_stock'       => $product->is_in_stock(),
        'is_on_backorder'   => $product->is_on_backorder(),
        'prices'            => [
            'price'                     => $to_minor( $product->get_price() ),
            'regular_price'             => $to_minor( is_user_logged_in() ? $product->get_price() : $product->get_regular_price() ),
            'sale_price'                => $to_minor( is_user_logged_in() ? '' : $product->get_sale_price() ),
            'currency_code'             => get_woocommerce_currency(),
            'currency_symbol'           => $symbol,
            'currency_minor_unit'       => $minor,
            'currency_decimal_separator'=> wc_get_price_decimal_separator(),
            'currency_thousand_separator'=> wc_get_price_thousand_separator(),
            'currency_prefix'           => $symbol,
            'currency_suffix'           => '',
        ],
    ];
}

function cwoo_filter_products( WP_REST_Request $req ) {
    try {
        return cwoo_filter_products_run( $req );
    } catch ( \Throwable $e ) {
        return new WP_Error(
            'cwoo_products_error',
            $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine(),
            [ 'status' => 500 ]
        );
    }
}

function cwoo_filter_products_run( WP_REST_Request $req ) {
    if ( $err = cwoo_maybe_down() ) return $err;
    if ( ! function_exists( 'WC' ) ) {
        return new WP_Error( 'no_wc', 'WooCommerce not available.', [ 'status' => 500 ] );
    }

    // Bind WooCommerce customer session to the logged-in user
    if ( is_user_logged_in() ) {
        $uid = get_current_user_id();
        if ( null === WC()->customer || WC()->customer->get_id() !== $uid ) {
            WC()->customer = new WC_Customer( $uid, true );
        }
    } else if ( defined( 'CWOO_WHOLESALE_USER_ID' ) && CWOO_WHOLESALE_USER_ID ) {
        // Wholesale pricing parity with the Store API for anonymous requests.
        wp_set_current_user( (int) CWOO_WHOLESALE_USER_ID );
        if ( null === WC()->customer || WC()->customer->get_id() !== (int) CWOO_WHOLESALE_USER_ID ) {
            WC()->customer = new WC_Customer( (int) CWOO_WHOLESALE_USER_ID, true );
        }
    }

    $page     = max( 1, (int) $req->get_param( 'page' ) ?: 1 );
    $per_page = min( 60, max( 1, (int) $req->get_param( 'per_page' ) ?: 20 ) );
    $search   = sanitize_text_field( (string) $req->get_param( 'search' ) );
    $orderby  = sanitize_text_field( (string) $req->get_param( 'orderby' ) ?: 'date' );
    $order    = strtoupper( sanitize_text_field( (string) $req->get_param( 'order' ) ?: 'DESC' ) );
    $order    = in_array( $order, [ 'ASC', 'DESC' ], true ) ? $order : 'DESC';

    $slugs = function ( $raw ) {
        return array_filter( array_map( 'sanitize_title', explode( ',', (string) $raw ) ) );
    };
    $categories = $slugs( $req->get_param( 'category' ) );
    $brands     = $slugs( $req->get_param( 'brand' ) );

    $min_price = $req->get_param( 'min_price' );
    $max_price = $req->get_param( 'max_price' );

    $args = [
        'post_type'      => 'product',
        'post_status'    => 'publish',
        'posts_per_page' => $per_page,
        'paged'          => $page,
        'order'          => $order,
    ];
    if ( $search ) $args['s'] = $search;

    switch ( $orderby ) {
        case 'price':
            $args['orderby']  = 'meta_value_num';
            $args['meta_key'] = '_price';
            break;
        case 'title':
            $args['orderby'] = 'title';
            break;
        case 'popularity':
            $args['orderby']  = 'meta_value_num';
            $args['meta_key'] = 'total_sales';
            break;
        case 'rating':
            $args['orderby']  = 'meta_value_num';
            $args['meta_key'] = '_wc_average_rating';
            break;
        default:
            $args['orderby'] = 'date';
    }

    $tax_query = [ 'relation' => 'AND' ];
    if ( ! empty( $categories ) ) {
        $tax_query[] = [ 'taxonomy' => 'product_cat', 'field' => 'slug', 'terms' => $categories, 'operator' => 'IN' ];
    }
    if ( ! empty( $brands ) ) {
        $tax_query[] = [ 'taxonomy' => 'product_brand', 'field' => 'slug', 'terms' => $brands, 'operator' => 'IN' ];
    }
    // Exclude marketing-materials unless explicitly requested by slug.
    if ( ! in_array( 'marketing-materials', $categories, true ) ) {
        $tax_query[] = [ 'taxonomy' => 'product_cat', 'field' => 'slug', 'terms' => [ 'marketing-materials' ], 'operator' => 'NOT IN' ];
    }
    if ( count( $tax_query ) > 1 ) $args['tax_query'] = $tax_query;

    $meta_query = [];
    if ( $min_price !== null && $min_price !== '' ) {
        $meta_query[] = [ 'key' => '_price', 'value' => (float) $min_price, 'compare' => '>=', 'type' => 'DECIMAL' ];
    }
    if ( $max_price !== null && $max_price !== '' ) {
        $meta_query[] = [ 'key' => '_price', 'value' => (float) $max_price, 'compare' => '<=', 'type' => 'DECIMAL' ];
    }
    if ( ! empty( $meta_query ) ) {
        $meta_query['relation'] = 'AND';
        $args['meta_query'] = $meta_query;
    }

    $uid = get_current_user_id();
    $cache_key = 'cwoo_query_u' . $uid . '_' . md5( serialize( $args ) );
    $cached = get_transient( $cache_key );
    if ( is_array( $cached ) ) {
        $response = rest_ensure_response( $cached['items'] );
        $response->header( 'X-WP-Total', $cached['total'] );
        $response->header( 'X-WP-TotalPages', $cached['totalPages'] );
        return $response;
    }

    $query = new WP_Query( $args );
    $items = [];
    foreach ( $query->posts as $post ) {
        $product = wc_get_product( $post->ID );
        if ( $product && $product->is_visible() ) {
            $items[] = cwoo_map_store_product( $product );
        }
    }

    $to_cache = [
        'items'      => $items,
        'total'      => (int) $query->found_posts,
        'totalPages' => (int) $query->max_num_pages,
    ];
    set_transient( $cache_key, $to_cache, 12 * HOUR_IN_SECONDS );

    $response = rest_ensure_response( $items );
    $response->header( 'X-WP-Total', (int) $query->found_posts );
    $response->header( 'X-WP-TotalPages', (int) $query->max_num_pages );
    return $response;
}

// ── HEADLESS FRONTEND URL ─────────────────────────────────────
// Set this to your Next.js site origin (no trailing slash).
if ( ! defined( 'CWOO_FRONTEND_URL' ) ) {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? $_SERVER['HTTP_REFERER'] ?? '';
    if ( strpos( $origin, 'localhost' ) !== false ) {
        define( 'CWOO_FRONTEND_URL', 'http://localhost:3000' );
    } else {
        define( 'CWOO_FRONTEND_URL', 'https://headless-woo-commerce-with-next-js.vercel.app' );
    }
}

// ── ORDER STATUS (for the headless thank-you page) ────────────
function cwoo_order_status( WP_REST_Request $req ) {
    if ( $err = cwoo_maybe_down() ) return $err;
    $id  = absint( $req->get_param( 'order' ) );
    $key = sanitize_text_field( (string) $req->get_param( 'key' ) );
    $order = $id ? wc_get_order( $id ) : false;

    // The order key is the authorization — must match.
    if ( ! $order || ! hash_equals( (string) $order->get_order_key(), $key ) ) {
        return new WP_Error( 'not_found', 'Order not found.', [ 'status' => 404 ] );
    }

    $sym   = html_entity_decode( get_woocommerce_currency_symbol(), ENT_QUOTES | ENT_HTML5 );
    $items = [];
    foreach ( $order->get_items() as $item ) {
        $items[] = [
            'name'     => $item->get_name(),
            'quantity' => $item->get_quantity(),
            'total'    => $sym . number_format( (float) $item->get_total(), 2 ),
        ];
    }
    $created = $order->get_date_created();

    return rest_ensure_response( [
        'orderNumber'        => $order->get_order_number(),
        'status'             => strtoupper( $order->get_status() ),
        'isPaid'             => $order->is_paid(),
        'total'              => $sym . number_format( (float) $order->get_total(), 2 ),
        'date'               => $created ? $created->format( 'Y-m-d\TH:i:s' ) : '',
        'paymentMethodTitle' => $order->get_payment_method_title(),
        'email'              => $order->get_billing_email(),
        'items'              => $items,
    ] );
}

// ── AFTER PAYMENT → RETURN TO HEADLESS THANK-YOU PAGE ─────────
add_filter( 'woocommerce_get_return_url', 'cwoo_headless_return_url', 10, 2 );
function cwoo_headless_return_url( $url, $order ) {
    if ( ! $order ) return $url;
    return trailingslashit( CWOO_FRONTEND_URL )
        . 'checkout/thank-you?order=' . $order->get_id()
        . '&key=' . rawurlencode( $order->get_order_key() );
}

// The headless-styled pay UI only applies when the order-pay URL carries our
// ref marker (?ref=hedy) — added by the frontend redirect / "Pay now" links.
// Normal WordPress visitors keep the default theme pay page.
define( 'CWOO_PAY_REF', 'hedy' );
function cwoo_is_headless_pay() {
    return function_exists( 'is_checkout_pay_page' )
        && is_checkout_pay_page()
        && isset( $_GET['ref'] )
        && $_GET['ref'] === CWOO_PAY_REF;
}

// Hide the WordPress admin bar on the headless pay page.
add_filter( 'show_admin_bar', 'cwoo_hide_admin_bar_on_pay' );
function cwoo_hide_admin_bar_on_pay( $show ) {
    if ( cwoo_is_headless_pay() ) return false;
    return $show;
}

// On the headless pay page, show ONLY the payment method the customer chose in
// the React checkout (stored on the order) — pre-selected, no other options.
add_filter( 'woocommerce_available_payment_gateways', 'cwoo_pay_only_chosen_gateway', 20 );
function cwoo_pay_only_chosen_gateway( $gateways ) {
    if ( ! cwoo_is_headless_pay() ) return $gateways;

    $order_id = 0;
    if ( isset( $GLOBALS['wp']->query_vars['order-pay'] ) ) {
        $order_id = absint( $GLOBALS['wp']->query_vars['order-pay'] );
    }
    if ( ! $order_id && function_exists( 'get_query_var' ) ) {
        $order_id = absint( get_query_var( 'order-pay' ) );
    }
    if ( ! $order_id ) return $gateways;

    $order  = wc_get_order( $order_id );
    $chosen = $order ? $order->get_payment_method() : '';

    if ( $chosen && isset( $gateways[ $chosen ] ) ) {
        return [ $chosen => $gateways[ $chosen ] ];
    }
    return $gateways;
}

// Let a guest (no WordPress session) pay for an order when they present the
// correct order key. Without this, orders that have a customer_id force a
// /login redirect, which breaks the embedded/headless payment flow.
add_filter( 'user_has_cap', 'cwoo_grant_pay_for_order', 10, 3 );
function cwoo_grant_pay_for_order( $allcaps, $caps, $args ) {
    if ( empty( $args[0] ) || 'pay_for_order' !== $args[0] ) return $allcaps;

    $order_id = isset( $args[2] ) ? absint( $args[2] ) : 0;
    if ( ! $order_id && isset( $GLOBALS['wp']->query_vars['order-pay'] ) ) {
        $order_id = absint( $GLOBALS['wp']->query_vars['order-pay'] );
    }
    $key = isset( $_GET['key'] ) ? sanitize_text_field( wp_unslash( $_GET['key'] ) ) : '';
    if ( ! $order_id || ! $key ) return $allcaps;

    $order = wc_get_order( $order_id );
    if ( $order && hash_equals( (string) $order->get_order_key(), $key ) ) {
        foreach ( (array) $caps as $c ) {
            $allcaps[ $c ] = true;
        }
    }
    return $allcaps;
}

// ── STYLE THE HOSTED ORDER-PAY PAGE TO MATCH THE STOREFRONT ───
add_action( 'wp_head', 'cwoo_pay_page_styles', 99 );
function cwoo_pay_page_styles() {
    if ( ! cwoo_is_headless_pay() ) return;
    ?>
    <style id="cwoo-pay-styles">
      :root { --cwoo-red:#d93b2e; --cwoo-ink:#111; --cwoo-line:rgba(0,0,0,.1); }

      /* Kill admin bar + ALL theme chrome (Porto-specific) */
      html { margin-top:0 !important; }
      #wpadminbar,
      .header-wrapper, header, #masthead, .site-header, #header, .header,
      .footer-wrapper, footer, #colophon, .site-footer, #footer,
      .page-top, .breadcrumbs-wrap, .breadcrumb, .woocommerce-breadcrumb,
      .porto-breadcrumbs, .page-header, .page-title, #secondary, .sidebar,
      #side-nav-panel, .panel-overlay,
      #spin-wheel-popup, #closed-wheel-gif, #result-only,
      #topcontrol, #wordfenceBox, #wfboxOverlay,
      .dgwt-wcas-suggestions-wrapp { display:none !important; }

      body.woocommerce-checkout, body.woocommerce-page, body {
        background:#f4f4f5 !important;
        font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif !important;
        color:var(--cwoo-ink) !important;
        margin:0 !important;
      }

      /* Branded top bar */
      .cwoo-pay-bar {
        background:var(--cwoo-ink); color:#fff; text-align:center;
        padding:18px 16px; font-weight:800; letter-spacing:.2em;
        text-transform:uppercase; font-size:13px;
      }
      .cwoo-pay-bar span { color:var(--cwoo-red); }
      .cwoo-pay-sub { text-align:center; color:rgba(0,0,0,.5); font-size:12px;
        text-transform:uppercase; letter-spacing:.16em; font-weight:700; margin:28px 0 4px; }

      /* Layout: #main full width, container capped at the theme's 1280px */
      #main, .main-content, .main-content-wrap, #content, .content-area {
        max-width:100% !important; width:100% !important;
        margin:0 auto !important; padding:0 !important; float:none !important;
      }
      .container {
        max-width:1280px !important; width:100% !important;
        margin:0 auto !important; padding:0 16px !important; float:none !important;
      }
      /* #main > #content > .page-content span the full container width */
      #main #content .page-content, #content .page-content, .page-content {
        max-width:100% !important; width:100% !important; margin:0 auto !important; padding:0 !important;
      }
      #content { padding:0 0 48px !important; }
      .woocommerce h1, .entry-title { display:none !important; }
      .woocommerce-notices-wrapper { max-width:640px; margin:16px auto 0; }

      /* Order summary table */
      table.shop_table {
        width:100% !important; background:#fff; border:1px solid var(--cwoo-line) !important;
        border-collapse:separate !important; border-spacing:0; margin:0 0 20px !important;
      }
      table.shop_table th, table.shop_table td {
        padding:14px 18px !important; font-size:14px; border-color:rgba(0,0,0,.06) !important;
        vertical-align:middle;
      }
      table.shop_table thead th {
        text-transform:uppercase; letter-spacing:.12em; font-weight:800;
        font-size:11px; color:rgba(0,0,0,.6); border-bottom:1px solid var(--cwoo-line) !important;
      }
      table.shop_table tfoot th { text-transform:uppercase; letter-spacing:.06em; font-weight:800; }
      table.shop_table tfoot .order-total th, table.shop_table tfoot .order-total td {
        font-size:18px; font-weight:900; color:var(--cwoo-ink);
      }
      table.shop_table td.product-name { font-weight:600; }

      /* Payment box */
      #payment {
        background:#fff !important; border:1px solid var(--cwoo-line) !important;
        border-radius:0 !important; padding:22px !important;
      }
      #payment ul.payment_methods { border:0 !important; padding:0 !important; margin:0 !important; }
      #payment ul.payment_methods li {
        border:1px solid var(--cwoo-line); padding:14px 16px !important; margin-bottom:10px !important;
        list-style:none !important; transition:border-color .15s ease;
      }
      #payment ul.payment_methods li:hover { border-color:rgba(0,0,0,.35); }
      #payment ul.payment_methods li label { font-weight:700 !important; cursor:pointer; }
      #payment .payment_box {
        background:#fafafa !important; border:1px solid rgba(0,0,0,.08) !important;
        margin-top:12px !important; font-size:13px; color:rgba(0,0,0,.7);
      }
      #payment .payment_box:before { display:none !important; }
      #payment .wc-credit-card-form-card-number,
      #payment input.input-text { border:1px solid rgba(0,0,0,.15) !important; border-radius:0 !important; }

      /* Buttons + inputs */
      #place_order, .button, button.button, input.button, .wc-block-components-button {
        background:var(--cwoo-ink) !important; color:#fff !important;
        border:0 !important; border-radius:0 !important;
        text-transform:uppercase !important; letter-spacing:.18em !important; font-weight:800 !important;
        padding:18px 28px !important; width:100% !important; cursor:pointer !important;
        transition:background .2s ease !important; font-size:13px !important; margin-top:8px !important;
      }
      #place_order:hover, .button:hover { background:var(--cwoo-red) !important; }
      input[type=text], input[type=email], input[type=tel], input[type=number], select, textarea {
        border:1px solid rgba(0,0,0,.15) !important; border-radius:0 !important; padding:12px !important;
        font-size:14px !important;
      }
      a { color:var(--cwoo-red); }

      /* Kill theme decorative borders / shadows / lines around the content box */
      article, .post, .type-page, .hentry, .entry, .single-content,
      .woocommerce-order-pay, .post-inner {
        background:transparent !important; border:0 !important; box-shadow:none !important;
        border-radius:0 !important; padding:0 !important; margin:0 !important;
      }
      article:before, article:after, .post:before, .post:after,
      .woocommerce-order-pay:before, .entry:before { display:none !important; content:none !important; }
      hr, .wp-block-separator { display:none !important; }

      /* Comfortable top/bottom breathing room around the pay card */
      #content { padding:8px 0 56px !important; }
      .cwoo-pay-sub { margin:0 0 22px !important; }

      /* Remove Porto's decorative "featured box" border/gradient/shadow */
      .featured-box, .featured-box .box-content, .box-content, .page-content {
        background:transparent !important; border:0 !important; box-shadow:none !important;
        padding:0 !important; margin:0 !important;
      }
      .featured-box:before, .featured-box:after, .box-content:before,
      .featured-box .box-content:before { display:none !important; content:none !important; }

      /* The whole pay form sits in one clean white card */
      #order_review {
        background:#fff; border:1px solid var(--cwoo-line);
        padding:26px !important;
      }
      #order_review table.shop_table { border:0 !important; margin:0 0 6px !important; }
      #order_review table.shop_table thead th { padding-top:0 !important; }

      /* Selected payment method highlight (modern browsers) */
      #payment ul.payment_methods li:has(input:checked) {
        border-color:var(--cwoo-ink) !important;
        box-shadow:inset 0 0 0 1px var(--cwoo-ink);
        background:#fafafa;
      }
      #payment { border:0 !important; padding:18px 0 0 !important; }
      #payment .form-row { margin-top:16px !important; }

      /* ── Heading block ─────────────────────────────────────── */
      .cwoo-pay-head { text-align:center; margin:34px auto 22px; max-width:640px; padding:0 16px; }
      .cwoo-pay-head h1 {
        margin:0 !important; font-size:30px !important; line-height:1.1 !important;
        font-weight:900 !important; text-transform:uppercase; letter-spacing:-.5px;
        color:var(--cwoo-ink) !important; display:block !important;
      }
      .cwoo-pay-head p {
        margin:10px 0 0 !important; font-size:14px; color:rgba(0,0,0,.55);
      }
      .cwoo-pay-sub { display:none !important; }

      /* ── Order table: alignment + polish ───────────────────── */
      #order_review table.shop_table thead th.product-quantity,
      #order_review table.shop_table thead th.cwoo-status-col { text-align:center !important; }
      #order_review table.shop_table thead th.product-total { text-align:right !important; }

      #order_review table.shop_table td.product-name {
        font-weight:600; color:var(--cwoo-ink); line-height:1.4;
      }
      #order_review table.shop_table td.product-quantity {
        text-align:center !important; font-weight:700; white-space:nowrap;
      }
      #order_review table.shop_table td.product-quantity strong { font-weight:700; }
      #order_review table.shop_table td.product-subtotal,
      #order_review table.shop_table td.product-total {
        text-align:right !important; font-weight:700; white-space:nowrap;
      }
      #order_review table.shop_table tbody tr td { border-bottom:1px solid rgba(0,0,0,.06) !important; }

      /* Status column */
      #order_review table.shop_table td.cwoo-status-cell { text-align:center !important; }
      .cwoo-badge {
        display:inline-block; font-size:10px; font-weight:800; letter-spacing:.08em;
        text-transform:uppercase; padding:4px 10px; border-radius:999px; white-space:nowrap;
      }
      .cwoo-badge.ok   { background:#dcfce7; color:#166534; }
      .cwoo-badge.back { background:#ffedd5; color:#9a3412; }
      .cwoo-note {
        display:block; margin-top:6px; font-size:10px; line-height:1.35;
        color:rgba(0,0,0,.45); font-weight:500; max-width:150px; margin-left:auto; margin-right:auto;
      }

      /* Totals (tfoot) */
      #order_review table.shop_table tfoot th {
        text-align:left !important; font-weight:700; color:rgba(0,0,0,.7);
        text-transform:none !important; letter-spacing:0 !important;
      }
      #order_review table.shop_table tfoot td { text-align:right !important; font-weight:700; }
      #order_review table.shop_table tfoot tr:last-child th,
      #order_review table.shop_table tfoot tr:last-child td {
        font-size:18px !important; font-weight:900 !important; color:var(--cwoo-ink) !important;
        border-top:2px solid var(--cwoo-ink) !important; padding-top:16px !important;
      }
      #order_review table.shop_table tfoot small.shipped_via {
        display:block; font-weight:500; color:rgba(0,0,0,.45); font-size:11px; margin-top:2px;
      }
    </style>
    <?php
}

// Branded top bar + heading on the pay page.
add_action( 'wp_body_open', 'cwoo_pay_page_header' );
function cwoo_pay_page_header() {
    if ( ! cwoo_is_headless_pay() ) return;
    echo '<div class="cwoo-pay-bar">HEDY <span>STORE</span> &nbsp;—&nbsp; Secure Payment</div>';
    echo '<div class="cwoo-pay-head">'
       . '<h1>Complete Your Order</h1>'
       . '<p>Review your order and choose a payment method to finish.</p>'
       . '</div>';
}

// Restructure the order table: add a Status column and move the backorder
// notice out of the product name into it.
add_action( 'wp_footer', 'cwoo_pay_page_table_script', 99 );
function cwoo_pay_page_table_script() {
    if ( ! cwoo_is_headless_pay() ) return;
    ?>
    <script>
    (function(){
      function build(){
        var table = document.querySelector('#order_review table.shop_table');
        if(!table || table.dataset.cwooDone) return;
        table.dataset.cwooDone = '1';

        // 1) Add "Status" header before the Totals column
        var headRow = table.querySelector('thead tr');
        if(headRow){
          var th = document.createElement('th');
          th.className = 'cwoo-status-col';
          th.textContent = 'Status';
          var totalTh = headRow.querySelector('.product-total') || headRow.lastElementChild;
          headRow.insertBefore(th, totalTh);
        }

        // 2) For each product row, extract backorder info → status cell
        table.querySelectorAll('tbody tr.order_item').forEach(function(row){
          var nameCell = row.querySelector('td.product-name');
          var isBack = false, note = '';
          if(nameCell){
            nameCell.querySelectorAll('div, p').forEach(function(el){
              var t = (el.textContent||'').trim();
              if(/backorder/i.test(t)){ isBack = true; if(t.length > 14){ note = t; } }
              el.remove();
            });
          }
          var td = document.createElement('td');
          td.className = 'cwoo-status-cell';
          td.innerHTML = '<span class="cwoo-badge ' + (isBack?'back':'ok') + '">'
                       + (isBack ? 'Backordered' : 'In Stock') + '</span>'
                       + (note ? '<span class="cwoo-note">' + note + '</span>' : '');
          var totalCell = row.querySelector('td.product-subtotal, td.product-total') || row.lastElementChild;
          row.insertBefore(td, totalCell);
        });

        // 3) Widen tfoot label colspans (2 → 3) to match the new column count
        table.querySelectorAll('tfoot tr th[colspan="2"]').forEach(function(th){
          th.setAttribute('colspan','3');
        });
      }
      if(document.readyState === 'loading'){
        document.addEventListener('DOMContentLoaded', build);
      } else { build(); }
    })();
    </script>
    <?php
}

// Register the cwoo_quote custom post type (runs on init)
add_action( 'init', 'cwoo_register_quote_cpt' );
function cwoo_register_quote_cpt() {
    register_post_type( 'cwoo_quote', [
        'labels'  => [ 'name' => 'Quote Requests', 'singular_name' => 'Quote Request' ],
        'public'  => false,
        'show_ui' => true,
        'supports'=> [ 'title', 'editor', 'author' ],
        'show_in_menu' => 'woocommerce',
    ] );
}

function cwoo_override_cart_contents_temp( $cart_contents ) {
    global $cwoo_temp_cart_items;
    if ( isset( $cwoo_temp_cart_items ) ) {
        return $cwoo_temp_cart_items;
    }
    return $cart_contents;
}
// Clear cached pricing and query transients when products are updated, created, or deleted
add_action( 'woocommerce_update_product', 'cwoo_clear_transients_cache' );
add_action( 'woocommerce_new_product', 'cwoo_clear_transients_cache' );
add_action( 'woocommerce_trash_product', 'cwoo_clear_transients_cache' );
function cwoo_clear_transients_cache() {
    global $wpdb;
    $wpdb->query( "DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_cwoo_prices_user_%' OR option_name LIKE '_transient_timeout_cwoo_prices_user_%'" );
    $wpdb->query( "DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_cwoo_query_%' OR option_name LIKE '_transient_timeout_cwoo_query_%'" );
}
