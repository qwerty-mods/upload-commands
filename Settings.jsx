const { React } = require('powercord/webpack');
const { existsSync, lstatSync } = require('fs');
const { TextInput, SwitchItem, FormItem } = require('powercord/components/settings');

let default_location = require("path").join(require("os").homedir(), "Pictures").toString();

module.exports = class Settings extends React.PureComponent {
    constructor(props) {
        super(props);
        
        this._setState(false);
    }

    _setState(update) {
        const state = {
            isFilePathValid: this.props.getSetting('filePath') ? existsSync(this.props.getSetting('filePath')) : true,
            initialFilePathValue: this.props.getSetting('filePath', default_location),
        };

        if (update) {
            this.setState(state);
        } else {
            this.state = state;
        }
    }

    render() {
        return (
            <div>
                <TextInput
                    defaultValue={this.props.getSetting('filePath', default_location)}
                    required={true}
                    style={!this.state.isFilePathValid ? { borderColor: 'red' } : {}}
                    onChange={(value) => {
                        console.log(value);
                        if (value.length === 0 || (existsSync(value) && lstatSync(value).isDirectory())) {
                            this.setState({isFilePathValid: true});
                            this.props.updateSetting('filePath', value.length === 0 ? null : value);
                        } else {
                            this.setState({isFilePathValid: false});
                            this.props.updateSetting('filePath', this.state.initialFilePathValue);
                        }
                    }}
                    note="The file path that the command will search through for the image/file."
                >File Path</TextInput>

                <SwitchItem
                    value={this.props.getSetting('sendFile', false)}
                    onChange={() => {this.props.toggleSetting('sendFile')}}
                    note="When enabled, the file will be sent by you instead of Clyde"
                >Send File</SwitchItem>

            </div>
        )
    }
}
