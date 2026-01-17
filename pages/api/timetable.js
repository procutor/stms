import { supabase } from '../../lib/supabaseClient';

export default async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'GET':
      try {
        const { data, error } = await supabase
          .from('timetables')
          .select(`
            *,
            school:schools(name),
            class:classes(name),
            teacher:users(name),
            subject:subjects(name),
            module:modules(name),
            timeSlot:time_slots(name, startTime, endTime, day)
          `);

        if (error) {
          return res.status(500).json({ error: error.message });
        }

        res.status(200).json(data);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
      break;

    case 'POST':
      try {
        const { data, error } = await supabase
          .from('timetables')
          .insert(req.body)
          .select();

        if (error) {
          return res.status(500).json({ error: error.message });
        }

        res.status(201).json(data);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
      break;

    case 'PUT':
      try {
        const { id, ...updates } = req.body;
        const { data, error } = await supabase
          .from('timetables')
          .update(updates)
          .eq('id', id)
          .select();

        if (error) {
          return res.status(500).json({ error: error.message });
        }

        res.status(200).json(data);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
      break;

    case 'DELETE':
      try {
        const { id } = req.body;
        const { error } = await supabase
          .from('timetables')
          .delete()
          .eq('id', id);

        if (error) {
          return res.status(500).json({ error: error.message });
        }

        res.status(200).json({ message: 'Timetable entry deleted' });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}