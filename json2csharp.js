var json2csharp = function() {
  var obj = {
    tabSize: 4,
    classes: [],
    renderObject: function(object) {
      var children = [];
      var type = this.renderObjectInternal("AutoGeneratedObject", undefined, object);
      children.push(this.getDeserializeFunction(type));
      children.push(this.getSerializeFunction(type));
      this.classes.push(this.getClass("Converter", children));
      return this.getNamespace("AutoGenerated", this.classes);
    },
    renderObjectInternal: function(type, key, object) {
      var outer = this;
      var children = [];

      if (object == null || object == undefined) {
        return "object";
      } else if (typeof(object) == 'string') {
        return "string";
      } else if (typeof(object) == 'number') {
        return outer.isInt(object) ? "long" : "double";
      } else if (typeof(object) == 'boolean') {
        return "bool";
      } else if (object.constructor == Array) {
        return outer.renderObjectInternal(outer.getTypeName(type, key), key, object[0])+"[]"
      } else if (object.constructor == Object) {
        if (Object.keys(object).length === 0) {
          return "object";
        }

        Object.keys(object).forEach(function eachKey(innerKey) {
          var innerType = outer.renderObjectInternal(outer.getTypeName(type, innerKey), innerKey, object[innerKey])
          children.push(outer.getProperty(innerKey, innerType));
        });
      }

      this.classes.push(this.getClass(type, children));
      return type;
    },
    isInt: function(n) {
      return n % 1 === 0;
    },
    getTypeName: function(prefix, type) {
      if (type == "") {
        return prefix+"Empty";
      }
      return prefix+this.getPascalCase(type);
    },
    getPropertyName: function(type) {
      if (type == "") {
        return "_";
      }
      return this.sanitizeTypeName(this.getPascalCase(type));
    },
    sanitizeTypeName: function(type) {
      if (!isNaN(type) || type.match(/^\d/)) {
        type = "_"+type;
      }

      return type;
    },
    getNamespace: function(name, children) {
      var rendered = `using Newtonsoft.Json;\n\n`
      rendered +=    `namespace ${name}\n`;
      rendered +=    `{\n`
      rendered +=    children.join('\n\n')
      rendered +=    `\n}`

      return rendered;
    },
    getClass: function(type, children) {
      var indentation = this.getIndentation();
      var rendered =  `${indentation}public class ${type}\n`;
      rendered +=     `${indentation}{\n`
      rendered +=     children.join('\n\n')
      rendered +=     `\n${indentation}}`

      return rendered;
    },
    getProperty: function(key, type) {
      var indentation = this.getIndentation(2);
      var rendered = "";
      if (key != undefined) {
        rendered = `${indentation}[JsonProperty("${key}")]\n`
      }
      rendered +=  `${indentation}public ${type} ${this.getPropertyName(key)} { get; set; }`

      return rendered;
    },
    getPascalCase: function(str) {
      if (str == undefined) {return ""}
      return str.toLowerCase().replace(/(?:(^.)|([-_\s]+.))/g, function(match) {
        return match.charAt(match.length-1).toUpperCase();
      })
    },
    getIndentation: function(depth) {
      var tab = ' '.repeat(this.tabSize);
      if (depth > 1) {
        return tab.repeat(depth);
      }

      return tab;
    },
    getDeserializeFunction: function(type) {
      var indentation = this.getIndentation(2);
      var tab = this.getIndentation();
      var rendered =  `${indentation}public static ${type} Deserialize(string json)\n`
      rendered +=     `${indentation}{\n`
      rendered +=     `${indentation}${tab}return JsonConvert.DeserializeObject<${type}>(json);`
      rendered +=     `\n${indentation}}`
      return rendered
    },
    getSerializeFunction: function(type) {
      var indentation = this.getIndentation(2);
      var tab = this.getIndentation();
      var rendered =  `${indentation}public static string Serialize(${type} obj)\n`
      rendered +=     `${indentation}{\n`
      rendered +=     `${indentation}${tab}return JsonConvert.SerializeObject(obj, Formatting.Indented);`
      rendered +=     `\n${indentation}}`
      return rendered
    }
  }

  return obj;
}
