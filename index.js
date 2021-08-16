const { Plugin } = require('powercord/entities');
const { getModule, getModuleByDisplayName, channels } = require('powercord/webpack');

const { upload } = getModule(["upload", "cancel"], false);

const { createBotMessage } = getModule([ 'createBotMessage' ], false);
const { receiveMessage }   = getModule([ 'receiveMessage' ], false);

const Settings = require("./Settings");

const mime_types = require("./assets/mimetypes")

let default_location = require("path").join(require("os").homedir(), "Pictures").toString();

const fs = require('fs');
const path = require('path');

module.exports = class UploadCommands extends Plugin {
    startPlugin() {
        powercord.api.settings.registerSettings(this.entityID, {
            category: this.entityID,
            label: "Upload Commands",
            render: Settings,
        });
        powercord.api.commands.registerCommand({
            command: 'image',
            usage: '{f} [file]',
            description: 'Upload images or gifs.',
            executor: this.image.bind(this),
            autocomplete: this.image_autocomplete.bind(this),
        });
        powercord.api.commands.registerCommand({
            command: 'upload',
            usage: '{f} [file]',
            description: 'Upload other file types.',
            executor: this.other_files.bind(this),
            autocomplete: this.upload_autocomplete.bind(this),
        });
    }

    pluginWillUnload() {
        powercord.api.commands.unregisterCommand('image');
        powercord.api.commands.unregisterCommand('upload');
        powercord.api.settings.unregisterSettings(this.entityID);
    }

    async image(name) {
        name = name.join(" ");
        let fileLocation = path.join(this.settings.get("filePath"), name);

        let type = mime_types(name);
        if (!type.includes("image")) {
            return { result: "Not an Image" }
        }
        console.log(type);
        const buf = fs.readFileSync(fileLocation);
        const f = new File([buf], name, {type: type});

        if (this.settings.get("sendFile")) {
            upload(channels.getChannelId(), f);
        } else {

            const { pushFiles } = await getModule(["pushFiles"]);
            const UploadModal = await getModuleByDisplayName("UploadModal");
            pushFiles({ files: [f], channelId: channels.getChannelId() });
            require("powercord/modal").open(UploadModal);
            return {}
        }
    }

    async other_files(name) {
        name = name.join(" ");
        let fileLocation = path.join(this.settings.get("filePath"), name);

        let type = mime_types(name);
        const buf = fs.readFileSync(fileLocation);
        const f = new File([buf], name, {type: type});

        if (this.settings.get("sendFile")) {
            upload(channels.getChannelId(), f);
        } else {
            const { pushFiles } = await getModule(["pushFiles"]);
            const UploadModal = await getModuleByDisplayName("UploadModal");
            pushFiles({ files: [f], channelId: channels.getChannelId() });
            require("powercord/modal").open(UploadModal);
            return {}
        }
    }

    image_autocomplete(args) {
        args = args.join(" ");

        let allFiles = fs.readdirSync(this.settings.get('filePath', default_location));
        let files = [...allFiles]
            .filter((name) => {name = name.toLowerCase();return name.startsWith(args) && this.get_mime(name).startsWith("image")})
            .map((name) => ({ command: name }))

        return {
            commands: files,
            header: 'images list',
        };
    }

    upload_autocomplete(args) {
        args = args.join(" ");

        let allFiles = fs.readdirSync(this.settings.get('filePath', default_location));
        let files = [...allFiles]
            .filter((name) => {name = name.toLowerCase();return name.startsWith(args) && !this.get_mime(name).startsWith("image")})
            .map((name) => ({ command: name }))

        return {
            commands: files,
            header: 'files list',
        };}

    sendBotMessage(content) {
        const received = createBotMessage(channels.getChannelId(), '');
        received.embeds.push(content);
        return receiveMessage(received.channel_id, received);
    };

    get_mime(name) { // For some reason, I had to do this... not sure why
        return mime_types(name).toString();
    }
}