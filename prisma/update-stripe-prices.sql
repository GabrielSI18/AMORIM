-- Atualizar preços com IDs reais do Stripe
-- Gerado automaticamente em Sat Nov 29 02:17:47 -03 2025

-- BASIC
UPDATE prices SET stripe_price_id = 'price_1SYgXSLtQee2jCwwYRJdiI0z', stripe_product_id = 'prod_TVhxK2W1sXQgG1' WHERE plan_id = 'PLAN_BASIC' AND interval = 'month';
UPDATE prices SET stripe_price_id = 'price_1SYgXTLtQee2jCwwdItEBOjJ', stripe_product_id = 'prod_TVhxK2W1sXQgG1' WHERE plan_id = 'PLAN_BASIC' AND interval = 'year';

-- PRO  
UPDATE prices SET stripe_price_id = 'price_1SYgXULtQee2jCww5OFlnTT2', stripe_product_id = 'prod_TVhxhaqbzNSpK3' WHERE plan_id = 'PLAN_PRO' AND interval = 'month';
UPDATE prices SET stripe_price_id = 'price_1SYgXVLtQee2jCwwgqDd8WAl', stripe_product_id = 'prod_TVhxhaqbzNSpK3' WHERE plan_id = 'PLAN_PRO' AND interval = 'year';

-- ENTERPRISE
UPDATE prices SET stripe_price_id = 'price_1SYgXWLtQee2jCwwklZ1lbRc', stripe_product_id = 'prod_TVhxMoP9Ad8Q2n' WHERE plan_id = 'PLAN_ENTERPRISE' AND interval = 'month';
UPDATE prices SET stripe_price_id = 'price_1SYgXWLtQee2jCww7Z6rVV2o', stripe_product_id = 'prod_TVhxMoP9Ad8Q2n' WHERE plan_id = 'PLAN_ENTERPRISE' AND interval = 'year';
