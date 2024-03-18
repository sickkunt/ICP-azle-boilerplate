import { v4 as uuidv4 } from 'uuid';
import { Server, StableBTreeMap, ic } from 'azle';
import express from 'express';

/**
 * `messagesStorage` - A key-value data structure used to store travel-related messages.
 * We'll utilize a StableBTreeMap to ensure data persistence across canister upgrades.
 * Each message is stored with a unique ID generated using UUID.
 */

/**
 This type represents a travel-related message that can be listed on the platform.
 */
class TravelMessage {
   id: string;
   title: string;
   body: string;
   location: string;
   startDate: Date;
   endDate: Date;
   creatorId: string; // ID of the user who created the message
   createdAt: Date;
   updatedAt: Date | null;
}

const travelMessagesStorage = StableBTreeMap<string, TravelMessage>(0);

export default Server(() => {
   const app = express();
   app.use(express.json());

   app.post("/travel-messages", (req, res) => {
      const travelMessage: TravelMessage = {
         id: uuidv4(),
         createdAt: getCurrentDate(),
         ...req.body
      };
      travelMessagesStorage.insert(travelMessage.id, travelMessage);
      res.json(travelMessage);
   });

   app.get("/travel-messages", (req, res) => {
      res.json(travelMessagesStorage.values());
   });

   app.get("/travel-messages/:id", (req, res) => {
      const messageId = req.params.id;
      const travelMessageOpt = travelMessagesStorage.get(messageId);
      if ("None" in travelMessageOpt) {
         res.status(404).send(`Travel message with ID=${messageId} not found`);
      } else {
         res.json(travelMessageOpt.Some);
      }
   });

   app.put("/travel-messages/:id", (req, res) => {
      const messageId = req.params.id;
      const travelMessageOpt = travelMessagesStorage.get(messageId);
      if ("None" in travelMessageOpt) {
         res.status(400).send(`Couldn't update travel message with ID=${messageId}. Message not found`);
      } else {
         const travelMessage = travelMessageOpt.Some;
         const updatedTravelMessage = { ...travelMessage, ...req.body, updatedAt: getCurrentDate() };
         travelMessagesStorage.insert(travelMessage.id, updatedTravelMessage);
         res.json(updatedTravelMessage);
      }
   });

   app.delete("/travel-messages/:id", (req, res) => {
      const messageId = req.params.id;
      const deletedTravelMessage = travelMessagesStorage.remove(messageId);
      if ("None" in deletedTravelMessage) {
         res.status(400).send(`Couldn't delete travel message with ID=${messageId}. Message not found`);
      } else {
         res.json(deletedTravelMessage.Some);
      }
   });

   return app.listen();
});

function getCurrentDate() {
   const timestamp = new Number(ic.time());
   return new Date(timestamp.valueOf() / 1000_000);
}

