exports.setting = (req, res) => {
  // ===== QUY ĐỊNH GIÁ (HARDCODE) =====
  const rule = {
    base_price_a: 150000,
    base_price_b: 170000,
    base_price_c: 200000,

    foreign_multiplier: 1.5,      // khách nước ngoài
    third_guest_surcharge: 0.25,  // +25%
    max_guests: 3                 // tối đa 3 khách / phòng
  };

  res.render("pages/setting", {
    pageTitle: "Cài đặt quy định giá",
    rule
  });
};
