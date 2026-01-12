-- Inserir produtos de restaurante/lanchonete para a vitrine
INSERT INTO products (user_id, name, description, price, category, code, is_active, image_url) VALUES
-- Lanches
('810f7a82-1bd7-4999-86a1-ddb4194b7254', 'X-Burger Clássico', 'Hambúrguer artesanal 180g, queijo cheddar, alface, tomate, cebola caramelizada e molho especial da casa', 28.90, 'Lanches', 'LAN001', true, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400'),
('810f7a82-1bd7-4999-86a1-ddb4194b7254', 'X-Bacon Duplo', 'Dois hambúrgueres 120g, bacon crocante, queijo prato, picles e maionese artesanal', 35.90, 'Lanches', 'LAN002', true, 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400'),
('810f7a82-1bd7-4999-86a1-ddb4194b7254', 'X-Frango Especial', 'Peito de frango grelhado, queijo muçarela, bacon, alface, tomate e maionese verde', 26.90, 'Lanches', 'LAN003', true, 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=400'),
('810f7a82-1bd7-4999-86a1-ddb4194b7254', 'Hot Dog Completo', 'Salsicha premium, vinagrete, batata palha, queijo ralado, milho, ervilha e molhos', 18.90, 'Lanches', 'LAN004', true, 'https://images.unsplash.com/photo-1612392062631-94e1c6c0d339?w=400'),

-- Pizzas
('810f7a82-1bd7-4999-86a1-ddb4194b7254', 'Pizza Margherita', 'Molho de tomate italiano, muçarela de búfala, tomate cereja, manjericão fresco e azeite extra virgem', 49.90, 'Pizzas', 'PIZ001', true, 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400'),
('810f7a82-1bd7-4999-86a1-ddb4194b7254', 'Pizza Calabresa', 'Calabresa artesanal fatiada, cebola roxa, muçarela e orégano', 45.90, 'Pizzas', 'PIZ002', true, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400'),
('810f7a82-1bd7-4999-86a1-ddb4194b7254', 'Pizza Quatro Queijos', 'Muçarela, gorgonzola, parmesão e catupiry cremoso', 52.90, 'Pizzas', 'PIZ003', true, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400'),
('810f7a82-1bd7-4999-86a1-ddb4194b7254', 'Pizza Portuguesa', 'Presunto, ovos, cebola, azeitonas pretas, ervilha e muçarela', 48.90, 'Pizzas', 'PIZ004', true, 'https://images.unsplash.com/photo-1600628421055-4d30de868b8f?w=400'),

-- Bebidas
('810f7a82-1bd7-4999-86a1-ddb4194b7254', 'Refrigerante Lata', 'Coca-Cola, Guaraná, Fanta ou Sprite - 350ml', 6.90, 'Bebidas', 'BEB001', true, 'https://images.unsplash.com/photo-1581636625402-29b2a704ef13?w=400'),
('810f7a82-1bd7-4999-86a1-ddb4194b7254', 'Suco Natural', 'Laranja, limão, maracujá ou abacaxi - 500ml', 12.90, 'Bebidas', 'BEB002', true, 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400'),
('810f7a82-1bd7-4999-86a1-ddb4194b7254', 'Milkshake', 'Chocolate, morango ou ovomaltine - 400ml', 16.90, 'Bebidas', 'BEB003', true, 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400'),

-- Porções
('810f7a82-1bd7-4999-86a1-ddb4194b7254', 'Batata Frita', 'Porção de batatas fritas crocantes com sal e orégano - 300g', 22.90, 'Porções', 'POR001', true, 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400'),
('810f7a82-1bd7-4999-86a1-ddb4194b7254', 'Onion Rings', 'Anéis de cebola empanados e fritos, acompanha molho barbecue', 24.90, 'Porções', 'POR002', true, 'https://images.unsplash.com/photo-1639024471283-03518883512d?w=400'),
('810f7a82-1bd7-4999-86a1-ddb4194b7254', 'Nuggets de Frango', 'Porção com 12 unidades de nuggets crocantes, acompanha molho', 28.90, 'Porções', 'POR003', true, 'https://images.unsplash.com/photo-1562967914-608f82629710?w=400'),

-- Sobremesas
('810f7a82-1bd7-4999-86a1-ddb4194b7254', 'Petit Gateau', 'Bolo de chocolate com recheio cremoso, acompanha sorvete de creme', 24.90, 'Sobremesas', 'SOB001', true, 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400'),
('810f7a82-1bd7-4999-86a1-ddb4194b7254', 'Brownie com Sorvete', 'Brownie de chocolate belga com sorvete de creme e calda de chocolate', 19.90, 'Sobremesas', 'SOB002', true, 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=400'),
('810f7a82-1bd7-4999-86a1-ddb4194b7254', 'Açaí na Tigela', 'Açaí cremoso 500ml com granola, banana, morango e leite condensado', 25.90, 'Sobremesas', 'SOB003', true, 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=400');