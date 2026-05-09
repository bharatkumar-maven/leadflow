const cron = require("node-cron");
const { Lead, Task } = require("../models");
const { Op } = require("sequelize");
const outreach = require("../services/outreachService");
const logger = require("../utils/logger");

exports.init = () => {
  // Every hour: check for overdue follow-ups
  cron.schedule("0 * * * *", async () => {
    try {
      const leads = await Lead.findAll({
        where: { nextFollowUpAt: { [Op.lte]: new Date() }, status: { [Op.notIn]: ["won","lost"] } }
      });
      logger.info(`Follow-up scheduler: ${leads.length} leads due`);
      for (const lead of leads) {
        if (lead.email) {
          try {
            await outreach.send({ channel: "email", lead,
              subject: "Following up on your inquiry",
              message: `Hi ${lead.firstName},\n\nI wanted to follow up on your recent inquiry. Are you still interested?\n\nBest regards,\nThe Team`,
              userId: null });
            await lead.update({ nextFollowUpAt: null, lastContactedAt: new Date() });
          } catch (err) { logger.error(`Follow-up failed for ${lead.id}:`, err); }
        }
      }
    } catch (err) { logger.error("Scheduler error:", err); }
  });

  // Daily at 9am: overdue task reminders
  cron.schedule("0 9 * * *", async () => {
    try {
      const overdueTasks = await Task.count({ where: { status: "pending", dueAt: { [Op.lt]: new Date() } } });
      logger.info(`Daily: ${overdueTasks} overdue tasks`);
    } catch (err) { logger.error("Task reminder error:", err); }
  });

  logger.info("Scheduler initialized");
};
