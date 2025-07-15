import databaseConnection from "../../datasource/datasource";
import express, { Request, Response } from "express";
import { Relationship } from "../../entities/relationship";
import { Members } from "../../entities/members";

const route = express.Router();

route.post("/", async (req: Request, res: Response) => {
  try {
    const { parent_id, child_id } = req.body;

    const relationRepo = databaseConnection.getRepository(Relationship);
    const membersRepo = databaseConnection.getRepository(Members);

    const parent = await membersRepo.findOneBy({ id: parent_id });
    const child = await membersRepo.findOneBy({ id: child_id });

    if (!parent || !child) {
      return res.status(404).json({
        status: false,
        code: 404,
        message: "Parent or Child not found",
      });
    }

    const createRelation = new Relationship();
    createRelation.parent = parent;
    createRelation.child = child;

    const response = await relationRepo.save(createRelation);

    res.status(200).json({
      status: true,
      code: 200,
      message: "Relationship created successfully",
      data: response
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default route;
