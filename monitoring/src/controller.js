import { Monitoring } from "./db/model.js";

export const getEventByStationId = async (req, res) => {
  try {
    const { id } = req.params;
    const events = await Monitoring.getEventByStationId(id);
    res.status(200).json(events);
  } catch (error) {
    const { message } = error;
    res.status(400).json({ message });
  }
};
