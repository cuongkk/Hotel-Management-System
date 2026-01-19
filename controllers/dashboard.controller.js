const { query } = require("../configs/database.config");

module.exports.dashboard = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    
    const defaultStart = `${currentYear}-01-01`;
    const defaultEnd = `${currentYear}-12-31`;

    const startDate = req.query.startDate || defaultStart;
    const endDate = req.query.endDate || defaultEnd;

    const getRooms = () => query(`
      SELECT
      COUNT(*) FILTER (WHERE status = 'AVAILABLE') AS available,
      COUNT(*) FILTER (WHERE status = 'OCCUPIED') AS occupied,
      COUNT(*) FILTER (WHERE status = 'MAINTENANCE') AS maintenance
      FROM rooms
    `);

    const getRevenue = (start, end) => query(`
      SELECT SUM(total_amount) AS total_revenue 
      FROM invoices
      WHERE payment_date >= $1 AND payment_date <= $2
    `, [start, end]);

    const getDetailRooms = () => query(`
      SELECT room_id AS id, room_name AS name, type_name AS type, base_price AS price, status
      FROM rooms JOIN room_types on rooms.room_type_id = room_types.room_type_id
      ORDER BY rooms.room_id
    `);

    const getStaffs = () => query(`
      SELECT
      COUNT(*) FILTER(WHERE role = 'STAFF' AND is_active = TRUE) AS active,
      COUNT(*) FILTER(WHERE role = 'STAFF' AND is_active = FALSE) AS inactive
      FROM users
    `);

    const getRoomTypes = () => query(`
      SELECT type_name
      FROM room_types
      ORDER BY type_name 
    `)

    const [Rooms, Revenue, detailRooms, Staffs, RoomTypes] = await Promise.all([
        getRooms(),
        getRevenue(startDate, endDate), 
        getDetailRooms(),
        getStaffs(),
        getRoomTypes()
      ]);

    const totalAvailableRooms = Number(Rooms.rows[0].available) || 0;
    const totalOccupiedRooms = Number(Rooms.rows[0].occupied) || 0;
    const totalMaintenanceRooms = Number(Rooms.rows[0].maintenance) || 0;

    const totalActiveStaffs = Number(Staffs.rows[0].active) || 0;
    const totalInactiveStaffs = Number(Staffs.rows[0].inactive) || 0;


    res.render("pages/dashboard.pug", {
      pageTitle: "Tổng quan",
      Statistic: {
        totalAvailableRooms,
        totalOccupiedRooms,
        totalMaintenanceRooms,
        totalRooms: totalAvailableRooms + totalOccupiedRooms + totalMaintenanceRooms,
        totalRevenue: Number(Revenue.rows[0].total_revenue) || 0,
        totalActiveStaffs,
        totalInactiveStaffs,
        totalStaffs: totalActiveStaffs + totalInactiveStaffs
      },
      RoomMap: detailRooms.rows,
      filter: {
        startDate,
        endDate
      },
      RoomTypes: RoomTypes.rows
    });


  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return res.status(500).send("Internal Server Error");
  }
};
