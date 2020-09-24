import { NgModule, Component, Input, Output, EventEmitter, ContentChildren, Inject, ElementRef, forwardRef, ChangeDetectionStrategy, ViewEncapsulation } from '@angular/core';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'primeng/api';
import { PrimeTemplate } from 'primeng/api';
import { TreeDragDropService } from 'primeng/api';
import { ObjectUtils } from 'primeng/utils';
import { DomHandler } from 'primeng/dom';
import { RippleModule } from 'primeng/ripple';
export class UITreeNode {
    constructor(tree) {
        this.tree = tree;
    }
    ngOnInit() {
        this.node.parent = this.parentNode;
        if (this.parentNode) {
            this.tree.syncNodeOption(this.node, this.tree.value, 'parent', this.tree.getNodeWithKey(this.parentNode.key, this.tree.value));
        }
    }
    getIcon() {
        let icon;
        if (this.node.icon)
            icon = this.node.icon;
        else
            icon = this.node.expanded && this.node.children && this.node.children.length ? this.node.expandedIcon : this.node.collapsedIcon;
        return UITreeNode.ICON_CLASS + ' ' + icon;
    }
    isLeaf() {
        return this.tree.isNodeLeaf(this.node);
    }
    toggle(event) {
        if (this.node.expanded)
            this.collapse(event);
        else
            this.expand(event);
    }
    expand(event) {
        this.node.expanded = true;
        if (this.tree.virtualScroll) {
            this.tree.updateSerializedValue();
        }
        this.tree.onNodeExpand.emit({ originalEvent: event, node: this.node });
    }
    collapse(event) {
        this.node.expanded = false;
        if (this.tree.virtualScroll) {
            this.tree.updateSerializedValue();
        }
        this.tree.onNodeCollapse.emit({ originalEvent: event, node: this.node });
    }
    onNodeClick(event) {
        this.tree.onNodeClick(event, this.node);
    }
    onNodeKeydown(event) {
        if (event.which === 13) {
            this.tree.onNodeClick(event, this.node);
        }
    }
    onNodeTouchEnd() {
        this.tree.onNodeTouchEnd();
    }
    onNodeRightClick(event) {
        this.tree.onNodeRightClick(event, this.node);
    }
    isSelected() {
        return this.tree.isSelected(this.node);
    }
    onDropPoint(event, position) {
        event.preventDefault();
        let dragNode = this.tree.dragNode;
        let dragNodeIndex = this.tree.dragNodeIndex;
        let dragNodeScope = this.tree.dragNodeScope;
        let isValidDropPointIndex = this.tree.dragNodeTree === this.tree ? (position === 1 || dragNodeIndex !== this.index - 1) : true;
        if (this.tree.allowDrop(dragNode, this.node, dragNodeScope, DropType.DropPoint) && isValidDropPointIndex) {
            let dropParams = Object.assign({}, this.createDropPointEventMetadata(position));
            if (this.tree.validateDrop) {
                // let newNodeList = this.node.parent ? this.node.parent.children : this.tree.value;
                // let dropIndex = this.index;
                // const resolve = new Subject<boolean>();
                // resolve.pipe(first()).subscribe(proceed => {
                //     if (proceed !== false) {
                //         this.tree.dragNodeSubNodes.splice(dragNodeIndex, 1);
                //         if (position < 0) {
                //             dropIndex = (this.tree.dragNodeSubNodes === newNodeList) ? ((this.tree.dragNodeIndex > this.index) ? this.index : this.index - 1) : this.index;
                //             newNodeList.splice(dropIndex, 0, dragNode);
                //         }
                //         else {
                //             dropIndex = newNodeList.length;
                //             newNodeList.push(dragNode);
                //         }
                //     }
                //     this.tree.dragDropService.stopDrag({
                //         node: dragNode,
                //         subNodes: this.node.parent ? this.node.parent.children : this.tree.value,
                //         index: dragNodeIndex
                //     });
                //     let newNodeList = event.dropNode.parent ? event.dropNode.parent.children : this.tree.value;
                //     event.dragNodeSubNodes.splice(event.dragNodeIndex, 1);
                //     let dropIndex = this.index;
                //     if (event.position < 0) {
                //         dropIndex = (event.dragNodeSubNodes === newNodeList) ? ((event.dragNodeIndex > event.index) ? event.index : event.index - 1) : event.index;
                //         newNodeList.splice(dropIndex, 0, event.dragNode);
                //     }
                //     else {
                //         dropIndex = newNodeList.length;
                //         newNodeList.push(event.dragNode);
                //     }
                //     this.tree.dragDropService.stopDrag({
                //         node: event.dragNode,
                //         subNodes: event.dropNode.parent ? event.dropNode.parent.children : this.tree.value,
                //         index: event.dragNodeIndex
                //     });
                // });
                // this.tree.onNodeDrop.emit({
                //     originalEvent: event,
                //     dragNode: dragNode,
                //     dropNode: this.node,
                //     dropIndex: dropIndex,
                //     proceed: resolve
                // });
                this.tree.onNodeDrop.emit({
                    originalEvent: event,
                    dragNode: dragNode,
                    dropNode: this.node,
                    dropIndex: this.index,
                    accept: () => {
                        this.processPointDrop(dropParams);
                    }
                });
            }
            else {
                this.processPointDrop(dropParams);
                this.tree.onNodeDrop.emit({
                    originalEvent: event,
                    dragNode: dragNode,
                    dropNode: this.node,
                    dropIndex: this.index
                });
            }
        }
        this.draghoverPrev = false;
        this.draghoverNext = false;
    }
    processPointDrop(event) {
        let newNodeList = event.dropNode.parent ? event.dropNode.parent.children : this.tree.value;
        event.dragNodeSubNodes.splice(event.dragNodeIndex, 1);
        let dropIndex = this.index;
        if (event.position < 0) {
            dropIndex = (event.dragNodeSubNodes === newNodeList) ? ((event.dragNodeIndex > event.index) ? event.index : event.index - 1) : event.index;
            newNodeList.splice(dropIndex, 0, event.dragNode);
        }
        else {
            dropIndex = newNodeList.length;
            newNodeList.push(event.dragNode);
        }
        this.tree.dragDropService.stopDrag({
            node: event.dragNode,
            subNodes: event.dropNode.parent ? event.dropNode.parent.children : this.tree.value,
            index: event.dragNodeIndex
        });
    }
    createDropPointEventMetadata(position) {
        return {
            dragNode: this.tree.dragNode,
            dragNodeIndex: this.tree.dragNodeIndex,
            dragNodeSubNodes: this.tree.dragNodeSubNodes,
            dropNode: this.node,
            index: this.index,
            position: position
        };
    }
    onDropPointDragOver(event) {
        event.dataTransfer.dropEffect = 'move';
        event.preventDefault();
    }
    onDropPointDragEnter(event, position) {
        if (this.tree.allowDrop(this.tree.dragNode, this.node, this.tree.dragNodeScope, DropType.DropPoint)) {
            if (position < 0)
                this.draghoverPrev = true;
            else
                this.draghoverNext = true;
        }
    }
    onDropPointDragLeave(event) {
        this.draghoverPrev = false;
        this.draghoverNext = false;
    }
    onDragStart(event) {
        if (this.tree.draggableNodes && this.node.draggable !== false) {
            event.dataTransfer.setData("text", "data");
            this.tree.dragDropService.startDrag({
                tree: this,
                node: this.node,
                subNodes: this.node.parent ? this.node.parent.children : this.tree.value,
                index: this.index,
                scope: this.tree.draggableScope
            });
        }
        else {
            event.preventDefault();
        }
    }
    onDragStop(event) {
        this.tree.dragDropService.stopDrag({
            node: this.node,
            subNodes: this.node.parent ? this.node.parent.children : this.tree.value,
            index: this.index
        });
    }
    onDropNodeDragOver(event) {
        event.dataTransfer.dropEffect = 'move';
        if (this.tree.droppableNodes) {
            event.preventDefault();
            event.stopPropagation();
        }
    }
    onDropNode(event) {
        if (this.tree.droppableNodes && this.node.droppable !== false) {
            let dragNode = this.tree.dragNode;
            if (this.tree.allowDrop(dragNode, this.node, this.tree.dragNodeScope, DropType.Node)) {
                // let dragNodeIndex = this.tree.dragNodeIndex;
                // const resolve = new Subject<boolean>();
                // resolve.pipe(first()).subscribe(proceed => {
                //     if (proceed !== false) {
                //         this.tree.dragNodeSubNodes.splice(dragNodeIndex, 1);
                //         if (this.node.children)
                //             this.node.children.push(dragNode);
                //         else
                //             this.node.children = [dragNode];
                //     }
                //     this.tree.dragDropService.stopDrag({
                //         node: dragNode,
                //         subNodes: this.node.parent ? this.node.parent.children : this.tree.value,
                //         index: this.tree.dragNodeIndex
                //     });
                // });
                // this.tree.onNodeDrop.emit({
                //     originalEvent: event,
                //     dragNode: dragNode,
                //     dropNode: this.node,
                //     index: this.index,
                //     proceed: resolve
                // });
                let dropParams = Object.assign({}, this.createDropNodeEventMetadata());
                if (this.tree.validateDrop) {
                    this.tree.onNodeDrop.emit({
                        originalEvent: event,
                        dragNode: dragNode,
                        dropNode: this.node,
                        index: this.index,
                        accept: () => {
                            this.processNodeDrop(dropParams);
                        }
                    });
                }
                else {
                    this.processNodeDrop(dropParams);
                    this.tree.onNodeDrop.emit({
                        originalEvent: event,
                        dragNode: dragNode,
                        dropNode: this.node,
                        index: this.index
                    });
                }
            }
        }
        event.preventDefault();
        event.stopPropagation();
        this.draghoverNode = false;
    }
    createDropNodeEventMetadata() {
        return {
            dragNode: this.tree.dragNode,
            dragNodeIndex: this.tree.dragNodeIndex,
            dragNodeSubNodes: this.tree.dragNodeSubNodes,
            dropNode: this.node
        };
    }
    processNodeDrop(event) {
        let dragNodeIndex = event.dragNodeIndex;
        event.dragNodeSubNodes.splice(dragNodeIndex, 1);
        if (event.dropNode.children)
            event.dropNode.children.push(event.dragNode);
        else
            event.dropNode.children = [event.dragNode];
        this.tree.dragDropService.stopDrag({
            node: event.dragNode,
            subNodes: event.dropNode.parent ? event.dropNode.parent.children : this.tree.value,
            index: dragNodeIndex
        });
    }
    onDropNodeDragEnter(event) {
        if (this.tree.droppableNodes && this.node.droppable !== false && this.tree.allowDrop(this.tree.dragNode, this.node, this.tree.dragNodeScope, DropType.Node)) {
            this.draghoverNode = true;
        }
    }
    onDropNodeDragLeave(event) {
        if (this.tree.droppableNodes) {
            let rect = event.currentTarget.getBoundingClientRect();
            if (event.x > rect.left + rect.width || event.x < rect.left || event.y >= Math.floor(rect.top + rect.height) || event.y < rect.top) {
                this.draghoverNode = false;
            }
        }
    }
    onKeyDown(event) {
        const nodeElement = event.target.parentElement.parentElement;
        if (nodeElement.nodeName !== 'P-TREENODE') {
            return;
        }
        switch (event.which) {
            //down arrow
            case 40:
                const listElement = (this.tree.droppableNodes) ? nodeElement.children[1].children[1] : nodeElement.children[0].children[1];
                if (listElement && listElement.children.length > 0) {
                    this.focusNode(listElement.children[0]);
                }
                else {
                    const nextNodeElement = nodeElement.nextElementSibling;
                    if (nextNodeElement) {
                        this.focusNode(nextNodeElement);
                    }
                    else {
                        let nextSiblingAncestor = this.findNextSiblingOfAncestor(nodeElement);
                        if (nextSiblingAncestor) {
                            this.focusNode(nextSiblingAncestor);
                        }
                    }
                }
                event.preventDefault();
                break;
            //up arrow
            case 38:
                if (nodeElement.previousElementSibling) {
                    this.focusNode(this.findLastVisibleDescendant(nodeElement.previousElementSibling));
                }
                else {
                    let parentNodeElement = this.getParentNodeElement(nodeElement);
                    if (parentNodeElement) {
                        this.focusNode(parentNodeElement);
                    }
                }
                event.preventDefault();
                break;
            //right arrow
            case 39:
                if (!this.node.expanded && !this.tree.isNodeLeaf(this.node)) {
                    this.expand(event);
                }
                event.preventDefault();
                break;
            //left arrow
            case 37:
                if (this.node.expanded) {
                    this.collapse(event);
                }
                else {
                    let parentNodeElement = this.getParentNodeElement(nodeElement);
                    if (parentNodeElement) {
                        this.focusNode(parentNodeElement);
                    }
                }
                event.preventDefault();
                break;
            //enter
            case 13:
                this.tree.onNodeClick(event, this.node);
                event.preventDefault();
                break;
            default:
                //no op
                break;
        }
    }
    findNextSiblingOfAncestor(nodeElement) {
        let parentNodeElement = this.getParentNodeElement(nodeElement);
        if (parentNodeElement) {
            if (parentNodeElement.nextElementSibling)
                return parentNodeElement.nextElementSibling;
            else
                return this.findNextSiblingOfAncestor(parentNodeElement);
        }
        else {
            return null;
        }
    }
    findLastVisibleDescendant(nodeElement) {
        const listElement = Array.from(nodeElement.children).find(el => DomHandler.hasClass(el, 'p-treenode'));
        const childrenListElement = listElement.children[1];
        if (childrenListElement && childrenListElement.children.length > 0) {
            const lastChildElement = childrenListElement.children[childrenListElement.children.length - 1];
            return this.findLastVisibleDescendant(lastChildElement);
        }
        else {
            return nodeElement;
        }
    }
    getParentNodeElement(nodeElement) {
        const parentNodeElement = nodeElement.parentElement.parentElement.parentElement;
        return parentNodeElement.tagName === 'P-TREENODE' ? parentNodeElement : null;
    }
    focusNode(element) {
        if (this.tree.droppableNodes)
            element.children[1].children[0].focus();
        else
            element.children[0].children[0].focus();
    }
}
UITreeNode.ICON_CLASS = 'p-treenode-icon ';
UITreeNode.decorators = [
    { type: Component, args: [{
                selector: 'p-treeNode',
                template: `
        <ng-template [ngIf]="node">
            <li *ngIf="tree.droppableNodes" class="p-treenode-droppoint" [ngClass]="{'p-treenode-droppoint-active':draghoverPrev}"
            (drop)="onDropPoint($event,-1)" (dragover)="onDropPointDragOver($event)" (dragenter)="onDropPointDragEnter($event,-1)" (dragleave)="onDropPointDragLeave($event)"></li>
            <li *ngIf="!tree.horizontal" role="treeitem" [ngClass]="['p-treenode',node.styleClass||'', isLeaf() ? 'p-treenode-leaf': '']">
                <div class="p-treenode-content" (click)="onNodeClick($event)" (contextmenu)="onNodeRightClick($event)" (touchend)="onNodeTouchEnd()"
                    (drop)="onDropNode($event)" (dragover)="onDropNodeDragOver($event)" (dragenter)="onDropNodeDragEnter($event)" (dragleave)="onDropNodeDragLeave($event)"
                    [draggable]="tree.draggableNodes" (dragstart)="onDragStart($event)" (dragend)="onDragStop($event)" [attr.tabindex]="0"
                    [ngClass]="{'p-treenode-selectable':tree.selectionMode && node.selectable !== false,'p-treenode-dragover':draghoverNode, 'p-highlight':isSelected()}"
                    (keydown)="onKeyDown($event)" [attr.aria-posinset]="this.index + 1" [attr.aria-expanded]="this.node.expanded" [attr.aria-selected]="isSelected()" [attr.aria-label]="node.label">
                    <span class="p-tree-toggler p-link" (click)="toggle($event)" pRipple>
                        <span class="p-tree-toggler-icon pi pi-fw" [ngClass]="{'pi-chevron-right':!node.expanded,'pi-chevron-down':node.expanded}"></span>
                    </span>
                    <div class="p-checkbox p-component" *ngIf="tree.selectionMode == 'checkbox'" [attr.aria-checked]="isSelected()">
                        <div class="p-checkbox-box" [ngClass]="{'p-highlight': isSelected(), 'p-indeterminate': node.partialSelected}">
                            <span class="p-checkbox-icon pi" [ngClass]="{'pi-check':isSelected(),'pi-minus':node.partialSelected}"></span>
                        </div>
                    </div>
                    <span [class]="getIcon()" *ngIf="node.icon||node.expandedIcon||node.collapsedIcon"></span>
                    <span class="p-treenode-label">
                            <span *ngIf="!tree.getTemplateForNode(node)">{{node.label}}</span>
                            <span *ngIf="tree.getTemplateForNode(node)">
                                <ng-container *ngTemplateOutlet="tree.getTemplateForNode(node); context: {$implicit: node}"></ng-container>
                            </span>
                    </span>
                </div>
                <ul class="p-treenode-children" style="display: none;" *ngIf="!tree.virtualScroll && node.children && node.expanded" [style.display]="node.expanded ? 'block' : 'none'" role="group">
                    <p-treeNode *ngFor="let childNode of node.children;let firstChild=first;let lastChild=last; let index=index; trackBy: tree.trackBy" [node]="childNode" [parentNode]="node"
                        [firstChild]="firstChild" [lastChild]="lastChild" [index]="index" [style.height.px]="tree.virtualNodeHeight" [level]="level + 1"></p-treeNode>
                </ul>
            </li>
            <li *ngIf="tree.droppableNodes&&lastChild" class="p-treenode-droppoint" [ngClass]="{'p-treenode-droppoint-active':draghoverNext}"
            (drop)="onDropPoint($event,1)" (dragover)="onDropPointDragOver($event)" (dragenter)="onDropPointDragEnter($event,1)" (dragleave)="onDropPointDragLeave($event)"></li>
            <table *ngIf="tree.horizontal" [class]="node.styleClass">
                <tbody>
                    <tr>
                        <td class="p-treenode-connector" *ngIf="!root">
                            <table class="p-treenode-connector-table">
                                <tbody>
                                    <tr>
                                        <td [ngClass]="{'p-treenode-connector-line':!firstChild}"></td>
                                    </tr>
                                    <tr>
                                        <td [ngClass]="{'p-treenode-connector-line':!lastChild}"></td>
                                    </tr>
                                </tbody>
                            </table>
                        </td>
                        <td class="p-treenode" [ngClass]="{'p-treenode-collapsed':!node.expanded}">
                            <div class="p-treenode-content" tabindex="0" [ngClass]="{'p-treenode-selectable':tree.selectionMode,'p-highlight':isSelected()}" (click)="onNodeClick($event)" (contextmenu)="onNodeRightClick($event)"
                                (touchend)="onNodeTouchEnd()" (keydown)="onNodeKeydown($event)">
                                <span class="p-tree-toggler pi pi-fw" [ngClass]="{'pi-plus':!node.expanded,'pi-minus':node.expanded}" *ngIf="!isLeaf()" (click)="toggle($event)"></span>
                                <span [class]="getIcon()" *ngIf="node.icon||node.expandedIcon||node.collapsedIcon"></span>
                                <span class="p-treenode-label">
                                    <span *ngIf="!tree.getTemplateForNode(node)">{{node.label}}</span>
                                    <span *ngIf="tree.getTemplateForNode(node)">
                                        <ng-container *ngTemplateOutlet="tree.getTemplateForNode(node); context: {$implicit: node}"></ng-container>
                                    </span>
                                </span>
                            </div>
                        </td>
                        <td class="p-treenode-children-container" *ngIf="node.children && node.expanded" [style.display]="node.expanded ? 'table-cell' : 'none'">
                            <div class="p-treenode-children">
                                <p-treeNode *ngFor="let childNode of node.children;let firstChild=first;let lastChild=last; trackBy: tree.trackBy" [node]="childNode"
                                        [firstChild]="firstChild" [lastChild]="lastChild"></p-treeNode>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </ng-template>
    `,
                encapsulation: ViewEncapsulation.None
            },] }
];
UITreeNode.ctorParameters = () => [
    { type: undefined, decorators: [{ type: Inject, args: [forwardRef(() => Tree),] }] }
];
UITreeNode.propDecorators = {
    rowNode: [{ type: Input }],
    node: [{ type: Input }],
    parentNode: [{ type: Input }],
    root: [{ type: Input }],
    index: [{ type: Input }],
    firstChild: [{ type: Input }],
    lastChild: [{ type: Input }],
    level: [{ type: Input }]
};
export class Tree {
    constructor(el, dragDropService) {
        this.el = el;
        this.dragDropService = dragDropService;
        this.selectionChange = new EventEmitter();
        this.onNodeSelect = new EventEmitter();
        this.onNodeUnselect = new EventEmitter();
        this.onNodeExpand = new EventEmitter();
        this.onNodeCollapse = new EventEmitter();
        this.onNodeContextMenuSelect = new EventEmitter();
        this.onNodeDrop = new EventEmitter();
        this.layout = 'vertical';
        this.metaKeySelection = true;
        this.propagateSelectionUp = true;
        this.propagateSelectionDown = true;
        this.loadingIcon = 'pi pi-spinner';
        this.emptyMessage = 'No records found';
        this.filterBy = 'label';
        this.filterMode = 'lenient';
        this.trackBy = (index, item) => item;
        this.onFilter = new EventEmitter();
    }
    ngOnInit() {
        if (this.droppableNodes) {
            this.dragStartSubscription = this.dragDropService.dragStart$.subscribe(event => {
                this.dragNodeTree = event.tree;
                this.dragNode = event.node;
                this.dragNodeSubNodes = event.subNodes;
                this.dragNodeIndex = event.index;
                this.dragNodeScope = event.scope;
            });
            this.dragStopSubscription = this.dragDropService.dragStop$.subscribe(event => {
                this.dragNodeTree = null;
                this.dragNode = null;
                this.dragNodeSubNodes = null;
                this.dragNodeIndex = null;
                this.dragNodeScope = null;
                this.dragHover = false;
            });
        }
    }
    ngOnChanges(simpleChange) {
        if (simpleChange.value) {
            this.updateSerializedValue();
        }
    }
    get horizontal() {
        return this.layout == 'horizontal';
    }
    ngAfterContentInit() {
        if (this.templates.length) {
            this.templateMap = {};
        }
        this.templates.forEach((item) => {
            this.templateMap[item.name] = item.template;
        });
    }
    updateSerializedValue() {
        this.serializedValue = [];
        this.serializeNodes(null, this.getRootNode(), 0, true);
    }
    serializeNodes(parent, nodes, level, visible) {
        if (nodes && nodes.length) {
            for (let node of nodes) {
                node.parent = parent;
                const rowNode = {
                    node: node,
                    parent: parent,
                    level: level,
                    visible: visible && (parent ? parent.expanded : true)
                };
                this.serializedValue.push(rowNode);
                if (rowNode.visible && node.expanded) {
                    this.serializeNodes(node, node.children, level + 1, rowNode.visible);
                }
            }
        }
    }
    onNodeClick(event, node) {
        let eventTarget = event.target;
        if (DomHandler.hasClass(eventTarget, 'p-tree-toggler') || DomHandler.hasClass(eventTarget, 'p-tree-toggler-icon')) {
            return;
        }
        else if (this.selectionMode) {
            if (node.selectable === false) {
                return;
            }
            if (this.hasFilteredNodes()) {
                node = this.getNodeWithKey(node.key, this.value);
                if (!node) {
                    return;
                }
            }
            let index = this.findIndexInSelection(node);
            let selected = (index >= 0);
            if (this.isCheckboxSelectionMode()) {
                if (selected) {
                    if (this.propagateSelectionDown)
                        this.propagateDown(node, false);
                    else
                        this.selection = this.selection.filter((val, i) => i != index);
                    if (this.propagateSelectionUp && node.parent) {
                        this.propagateUp(node.parent, false);
                    }
                    this.selectionChange.emit(this.selection);
                    this.onNodeUnselect.emit({ originalEvent: event, node: node });
                }
                else {
                    if (this.propagateSelectionDown)
                        this.propagateDown(node, true);
                    else
                        this.selection = [...this.selection || [], node];
                    if (this.propagateSelectionUp && node.parent) {
                        this.propagateUp(node.parent, true);
                    }
                    this.selectionChange.emit(this.selection);
                    this.onNodeSelect.emit({ originalEvent: event, node: node });
                }
            }
            else {
                let metaSelection = this.nodeTouched ? false : this.metaKeySelection;
                if (metaSelection) {
                    let metaKey = (event.metaKey || event.ctrlKey);
                    if (selected && metaKey) {
                        if (this.isSingleSelectionMode()) {
                            this.selectionChange.emit(null);
                        }
                        else {
                            this.selection = this.selection.filter((val, i) => i != index);
                            this.selectionChange.emit(this.selection);
                        }
                        this.onNodeUnselect.emit({ originalEvent: event, node: node });
                    }
                    else {
                        if (this.isSingleSelectionMode()) {
                            this.selectionChange.emit(node);
                        }
                        else if (this.isMultipleSelectionMode()) {
                            this.selection = (!metaKey) ? [] : this.selection || [];
                            this.selection = [...this.selection, node];
                            this.selectionChange.emit(this.selection);
                        }
                        this.onNodeSelect.emit({ originalEvent: event, node: node });
                    }
                }
                else {
                    if (this.isSingleSelectionMode()) {
                        if (selected) {
                            this.selection = null;
                            this.onNodeUnselect.emit({ originalEvent: event, node: node });
                        }
                        else {
                            this.selection = node;
                            this.onNodeSelect.emit({ originalEvent: event, node: node });
                        }
                    }
                    else {
                        if (selected) {
                            this.selection = this.selection.filter((val, i) => i != index);
                            this.onNodeUnselect.emit({ originalEvent: event, node: node });
                        }
                        else {
                            this.selection = [...this.selection || [], node];
                            this.onNodeSelect.emit({ originalEvent: event, node: node });
                        }
                    }
                    this.selectionChange.emit(this.selection);
                }
            }
        }
        this.nodeTouched = false;
    }
    onNodeTouchEnd() {
        this.nodeTouched = true;
    }
    onNodeRightClick(event, node) {
        if (this.contextMenu) {
            let eventTarget = event.target;
            if (eventTarget.className && eventTarget.className.indexOf('p-tree-toggler') === 0) {
                return;
            }
            else {
                let index = this.findIndexInSelection(node);
                let selected = (index >= 0);
                if (!selected) {
                    if (this.isSingleSelectionMode())
                        this.selectionChange.emit(node);
                    else
                        this.selectionChange.emit([node]);
                }
                this.contextMenu.show(event);
                this.onNodeContextMenuSelect.emit({ originalEvent: event, node: node });
            }
        }
    }
    findIndexInSelection(node) {
        let index = -1;
        if (this.selectionMode && this.selection) {
            if (this.isSingleSelectionMode()) {
                let areNodesEqual = (this.selection.key && this.selection.key === node.key) || this.selection == node;
                index = areNodesEqual ? 0 : -1;
            }
            else {
                for (let i = 0; i < this.selection.length; i++) {
                    let selectedNode = this.selection[i];
                    let areNodesEqual = (selectedNode.key && selectedNode.key === node.key) || selectedNode == node;
                    if (areNodesEqual) {
                        index = i;
                        break;
                    }
                }
            }
        }
        return index;
    }
    syncNodeOption(node, parentNodes, option, value) {
        // to synchronize the node option between the filtered nodes and the original nodes(this.value)
        const _node = this.hasFilteredNodes() ? this.getNodeWithKey(node.key, parentNodes) : null;
        if (_node) {
            _node[option] = value || node[option];
        }
    }
    hasFilteredNodes() {
        return this.filter && this.filteredNodes && this.filteredNodes.length;
    }
    getNodeWithKey(key, nodes) {
        for (let node of nodes) {
            if (node.key === key) {
                return node;
            }
            if (node.children) {
                let matchedNode = this.getNodeWithKey(key, node.children);
                if (matchedNode) {
                    return matchedNode;
                }
            }
        }
    }
    propagateUp(node, select) {
        if (node.children && node.children.length) {
            let selectedCount = 0;
            let childPartialSelected = false;
            for (let child of node.children) {
                if (this.isSelected(child)) {
                    selectedCount++;
                }
                else if (child.partialSelected) {
                    childPartialSelected = true;
                }
            }
            if (select && selectedCount == node.children.length) {
                this.selection = [...this.selection || [], node];
                node.partialSelected = false;
            }
            else {
                if (!select) {
                    let index = this.findIndexInSelection(node);
                    if (index >= 0) {
                        this.selection = this.selection.filter((val, i) => i != index);
                    }
                }
                if (childPartialSelected || selectedCount > 0 && selectedCount != node.children.length)
                    node.partialSelected = true;
                else
                    node.partialSelected = false;
            }
            this.syncNodeOption(node, this.filteredNodes, 'partialSelected');
        }
        let parent = node.parent;
        if (parent) {
            this.propagateUp(parent, select);
        }
    }
    propagateDown(node, select) {
        let index = this.findIndexInSelection(node);
        if (select && index == -1) {
            this.selection = [...this.selection || [], node];
        }
        else if (!select && index > -1) {
            this.selection = this.selection.filter((val, i) => i != index);
        }
        node.partialSelected = false;
        this.syncNodeOption(node, this.filteredNodes, 'partialSelected');
        if (node.children && node.children.length) {
            for (let child of node.children) {
                this.propagateDown(child, select);
            }
        }
    }
    isSelected(node) {
        return this.findIndexInSelection(node) != -1;
    }
    isSingleSelectionMode() {
        return this.selectionMode && this.selectionMode == 'single';
    }
    isMultipleSelectionMode() {
        return this.selectionMode && this.selectionMode == 'multiple';
    }
    isCheckboxSelectionMode() {
        return this.selectionMode && this.selectionMode == 'checkbox';
    }
    isNodeLeaf(node) {
        return node.leaf == false ? false : !(node.children && node.children.length);
    }
    getRootNode() {
        return this.filteredNodes ? this.filteredNodes : this.value;
    }
    getTemplateForNode(node) {
        if (this.templateMap)
            return node.type ? (this.templateMap[node.type] ? this.templateMap[node.type] : this.templateMap['default']) : this.templateMap['default'];
        else
            return null;
    }
    onDragOver(event) {
        if (this.droppableNodes && (!this.value || this.value.length === 0)) {
            event.dataTransfer.dropEffect = 'move';
            event.preventDefault();
        }
    }
    onDrop(event) {
        if (this.droppableNodes && (!this.value || this.value.length === 0)) {
            event.preventDefault();
            let dragNode = this.dragNode;
            if (this.allowDrop(dragNode, null, this.dragNodeScope, DropType.Both)) {
                let dragNodeIndex = this.dragNodeIndex;
                this.dragNodeSubNodes.splice(dragNodeIndex, 1);
                this.value = this.value || [];
                this.value.push(dragNode);
                this.dragDropService.stopDrag({
                    node: dragNode
                });
            }
        }
    }
    onDragEnter(event) {
        if (this.droppableNodes && this.allowDrop(this.dragNode, null, this.dragNodeScope, DropType.Both)) {
            this.dragHover = true;
        }
    }
    onDragLeave(event) {
        if (this.droppableNodes) {
            let rect = event.currentTarget.getBoundingClientRect();
            if (event.x > rect.left + rect.width || event.x < rect.left || event.y > rect.top + rect.height || event.y < rect.top) {
                this.dragHover = false;
            }
        }
    }
    allowDrop(dragNode, dropNode, dragNodeScope, dropType) {
        if (!dragNode) {
            //prevent random html elements to be dragged
            return false;
        }
        else if (this.isValidDragScope(dragNodeScope)) {
            let allow = true;
            if (dropNode) {
                if (dragNode === dropNode) {
                    allow = false;
                }
                else {
                    let parent = dropNode.parent;
                    while (parent != null) {
                        if (parent === dragNode) {
                            allow = false;
                            break;
                        }
                        parent = parent.parent;
                    }
                    if (allow) {
                        const evaluateDropScope = (dropScope, dragScope) => {
                            if (typeof dropScope === 'string') {
                                if (typeof dragScope === 'string')
                                    allow = dropScope === dragScope;
                                else if (dragScope instanceof Array)
                                    allow = dragScope.indexOf(dropScope) != -1;
                            }
                            else if (dropScope instanceof Array) {
                                if (typeof dragScope === 'string') {
                                    allow = dropScope.indexOf(dragScope) != -1;
                                }
                                else if (dragScope instanceof Array) {
                                    for (let s of dropScope) {
                                        for (let ds of dragScope) {
                                            if (s === ds) {
                                                allow = true;
                                                break;
                                            }
                                        }
                                    }
                                }
                            }
                        };
                        if (dropType === DropType.Node) {
                            evaluateDropScope(dropNode.dropScope, dragNode.dragScope);
                        }
                        else if (dropType === DropType.DropPoint) {
                            evaluateDropScope(dropNode.dropPointScope, dragNode.dragScope);
                        }
                        else if (dropType === DropType.Both) {
                            evaluateDropScope(dropNode.dropScope, dragNode.dragScope);
                            evaluateDropScope(dropNode.dropPointScope, dragNode.dragScope);
                        }
                    }
                }
            }
            return allow;
        }
        else {
            return false;
        }
    }
    isValidDragScope(dragScope) {
        let dropScope = this.droppableScope;
        if (dropScope) {
            if (typeof dropScope === 'string') {
                if (typeof dragScope === 'string')
                    return dropScope === dragScope;
                else if (dragScope instanceof Array)
                    return dragScope.indexOf(dropScope) != -1;
            }
            else if (dropScope instanceof Array) {
                if (typeof dragScope === 'string') {
                    return dropScope.indexOf(dragScope) != -1;
                }
                else if (dragScope instanceof Array) {
                    for (let s of dropScope) {
                        for (let ds of dragScope) {
                            if (s === ds) {
                                return true;
                            }
                        }
                    }
                }
            }
            return false;
        }
        else {
            return true;
        }
    }
    _filter(event) {
        let filterValue = event.target.value;
        if (filterValue === '') {
            this.filteredNodes = null;
        }
        else {
            this.filteredNodes = [];
            const searchFields = this.filterBy.split(',');
            const filterText = ObjectUtils.removeAccents(filterValue).toLocaleLowerCase(this.filterLocale);
            const isStrictMode = this.filterMode === 'strict';
            for (let node of this.value) {
                let copyNode = Object.assign({}, node);
                let paramsWithoutNode = { searchFields, filterText, isStrictMode };
                if ((isStrictMode && (this.findFilteredNodes(copyNode, paramsWithoutNode) || this.isFilterMatched(copyNode, paramsWithoutNode))) ||
                    (!isStrictMode && (this.isFilterMatched(copyNode, paramsWithoutNode) || this.findFilteredNodes(copyNode, paramsWithoutNode)))) {
                    this.filteredNodes.push(copyNode);
                }
            }
        }
        this.updateSerializedValue();
        this.onFilter.emit({
            filter: filterValue,
            filteredValue: this.filteredNodes
        });
    }
    findFilteredNodes(node, paramsWithoutNode) {
        if (node) {
            let matched = false;
            if (node.children) {
                let childNodes = [...node.children];
                node.children = [];
                for (let childNode of childNodes) {
                    let copyChildNode = Object.assign({}, childNode);
                    if (this.isFilterMatched(copyChildNode, paramsWithoutNode)) {
                        matched = true;
                        node.children.push(copyChildNode);
                    }
                }
            }
            if (matched) {
                node.expanded = true;
                return true;
            }
        }
    }
    isFilterMatched(node, { searchFields, filterText, isStrictMode }) {
        let matched = false;
        for (let field of searchFields) {
            let fieldValue = ObjectUtils.removeAccents(String(ObjectUtils.resolveFieldData(node, field))).toLocaleLowerCase(this.filterLocale);
            if (fieldValue.indexOf(filterText) > -1) {
                matched = true;
            }
        }
        if (!matched || (isStrictMode && !this.isNodeLeaf(node))) {
            matched = this.findFilteredNodes(node, { searchFields, filterText, isStrictMode }) || matched;
        }
        return matched;
    }
    getBlockableElement() {
        return this.el.nativeElement.children[0];
    }
    ngOnDestroy() {
        if (this.dragStartSubscription) {
            this.dragStartSubscription.unsubscribe();
        }
        if (this.dragStopSubscription) {
            this.dragStopSubscription.unsubscribe();
        }
    }
}
Tree.decorators = [
    { type: Component, args: [{
                selector: 'p-tree',
                template: `
        <div [ngClass]="{'p-tree p-component':true,'p-tree-selectable':selectionMode,
                'p-treenode-dragover':dragHover,'p-tree-loading': loading, 'p-tree-flex-scrollable': scrollHeight === 'flex'}" 
            [ngStyle]="style" [class]="styleClass" *ngIf="!horizontal"
            (drop)="onDrop($event)" (dragover)="onDragOver($event)" (dragenter)="onDragEnter($event)" (dragleave)="onDragLeave($event)">
            <div class="p-tree-loading-overlay p-component-overlay" *ngIf="loading">
                <i [class]="'p-tree-loading-icon pi-spin ' + loadingIcon"></i>
            </div>
            <div *ngIf="filter" class="p-tree-filter-container">
                <input #filter type="text" autocomplete="off" class="p-tree-filter p-inputtext p-component" [attr.placeholder]="filterPlaceholder"
                    (keydown.enter)="$event.preventDefault()" (input)="_filter($event)">
                    <span class="p-tree-filter-icon pi pi-search"></span>
            </div>
            <ng-container *ngIf="!virtualScroll; else virtualScrollList">
                <div class="p-tree-wrapper" [style.max-height]="scrollHeight">
                    <ul class="p-tree-container" *ngIf="getRootNode()" role="tree" [attr.aria-label]="ariaLabel" [attr.aria-labelledby]="ariaLabelledBy">
                        <p-treeNode *ngFor="let node of getRootNode(); let firstChild=first;let lastChild=last; let index=index; trackBy: trackBy" [node]="node"
                                    [firstChild]="firstChild" [lastChild]="lastChild" [index]="index" [level]="0"></p-treeNode>
                    </ul>
                </div>
            </ng-container>
            <ng-template #virtualScrollList>
                <cdk-virtual-scroll-viewport class="p-tree-wrapper" [style.height]="scrollHeight" [itemSize]="virtualNodeHeight" [minBufferPx]="minBufferPx" [maxBufferPx]="maxBufferPx">
                    <ul class="p-tree-container" *ngIf="getRootNode()" role="tree" [attr.aria-label]="ariaLabel" [attr.aria-labelledby]="ariaLabelledBy">
                        <p-treeNode *cdkVirtualFor="let rowNode of serializedValue; let firstChild=first; let lastChild=last; let index=index; trackBy: trackBy; templateCacheSize: 0"  [level]="rowNode.level"
                                    [rowNode]="rowNode" [node]="rowNode.node" [firstChild]="firstChild" [lastChild]="lastChild" [index]="index" [style.height.px]="virtualNodeHeight"></p-treeNode>
                    </ul>
                </cdk-virtual-scroll-viewport>
            </ng-template>
            <div class="p-tree-empty-message" *ngIf="!loading && (value == null || value.length === 0)">{{emptyMessage}}</div>
        </div>
        <div [ngClass]="{'p-tree p-tree-horizontal p-component':true,'p-tree-selectable':selectionMode}"  [ngStyle]="style" [class]="styleClass" *ngIf="horizontal">
            <div class="p-tree-loading-mask p-component-overlay" *ngIf="loading">
                <i [class]="'p-tree-loading-icon pi-spin ' + loadingIcon"></i>
            </div>
            <table *ngIf="value&&value[0]">
                <p-treeNode [node]="value[0]" [root]="true"></p-treeNode>
            </table>
            <div class="p-tree-empty-message" *ngIf="!loading && (value == null || value.length === 0)">{{emptyMessage}}</div>
        </div>
    `,
                changeDetection: ChangeDetectionStrategy.Default,
                encapsulation: ViewEncapsulation.None,
                styles: [".p-tree-container{overflow:auto}.p-tree-container,.p-treenode-children{list-style-type:none;margin:0;padding:0}.p-tree-wrapper{overflow:auto}.p-tree-toggler,.p-treenode-selectable{-moz-user-select:none;-ms-user-select:none;-webkit-user-select:none;cursor:pointer;user-select:none}.p-tree-toggler{-ms-flex-align:center;-ms-flex-pack:center;align-items:center;display:-ms-inline-flexbox;display:inline-flex;justify-content:center;overflow:hidden;position:relative}.p-treenode-leaf>.p-treenode-content .p-tree-toggler{visibility:hidden}.p-treenode-content{-ms-flex-align:center;align-items:center;display:-ms-flexbox;display:flex}.p-tree-filter{width:100%}.p-tree-filter-container{display:block;position:relative;width:100%}.p-tree-filter-icon{margin-top:-.5rem;position:absolute;top:50%}.p-tree-loading{min-height:4rem;position:relative}.p-tree .p-tree-loading-overlay{-ms-flex-align:center;-ms-flex-pack:center;align-items:center;display:-ms-flexbox;display:flex;justify-content:center;position:absolute;z-index:2}.p-tree-flex-scrollable{-ms-flex:1;-ms-flex-direction:column;display:-ms-flexbox;display:flex;flex:1;flex-direction:column;height:100%}.p-tree-flex-scrollable .p-tree-wrapper{-ms-flex:1;flex:1}.p-tree .p-treenode-droppoint{height:4px;list-style-type:none}.p-tree .p-treenode-droppoint-active{border:0}.p-tree-horizontal{overflow:auto;padding-left:0;padding-right:0;width:auto}.p-tree.p-tree-horizontal table,.p-tree.p-tree-horizontal td,.p-tree.p-tree-horizontal tr{border-collapse:collapse;margin:0;padding:0;vertical-align:middle}.p-tree-horizontal .p-treenode-content{-ms-flex-align:center;align-items:center;display:-ms-flexbox;display:flex;font-weight:400;padding:.4em 1em .4em .2em}.p-tree-horizontal .p-treenode-parent .p-treenode-content{font-weight:400;white-space:nowrap}.p-tree.p-tree-horizontal .p-treenode{background:url(\"data:image/gif;base64,R0lGODlhAQABAIAAALGxsf///yH/C1hNUCBEYXRhWE1QPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4KPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNC4xLWMwMzQgNDYuMjcyOTc2LCBTYXQgSmFuIDI3IDIwMDcgMjI6Mzc6MzcgICAgICAgICI+CiAgIDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+CiAgICAgIDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiCiAgICAgICAgICAgIHhtbG5zOnhhcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyI+CiAgICAgICAgIDx4YXA6Q3JlYXRvclRvb2w+QWRvYmUgRmlyZXdvcmtzIENTMzwveGFwOkNyZWF0b3JUb29sPgogICAgICAgICA8eGFwOkNyZWF0ZURhdGU+MjAxMC0wMy0xMVQxMDoxNjo0MVo8L3hhcDpDcmVhdGVEYXRlPgogICAgICAgICA8eGFwOk1vZGlmeURhdGU+MjAxMC0wMy0xMVQxMjo0NDoxOVo8L3hhcDpNb2RpZnlEYXRlPgogICAgICA8L3JkZjpEZXNjcmlwdGlvbj4KICAgICAgPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIKICAgICAgICAgICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIj4KICAgICAgICAgPGRjOmZvcm1hdD5pbWFnZS9naWY8L2RjOmZvcm1hdD4KICAgICAgPC9yZGY6RGVzY3JpcHRpb24+CiAgIDwvcmRmOlJERj4KPC94OnhtcG1ldGE+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgCjw/eHBhY2tldCBlbmQ9InciPz4B//79/Pv6+fj39vX08/Lx8O/u7ezr6uno5+bl5OPi4eDf3t3c29rZ2NfW1dTT0tHQz87NzMvKycjHxsXEw8LBwL++vby7urm4t7a1tLOysbCvrq2sq6qpqKempaSjoqGgn56dnJuamZiXlpWUk5KRkI+OjYyLiomIh4aFhIOCgYB/fn18e3p5eHd2dXRzcnFwb25tbGtqaWhnZmVkY2JhYF9eXVxbWllYV1ZVVFNSUVBPTk1MS0pJSEdGRURDQkFAPz49PAA6OTg3NjU0MzIxMC8uLSwrKikoJyYlJCMiISAfHh0cGxoZGBcWFRQTEhEQDw4NDAsKCQgHBgUEAwIBAAAh+QQABwD/ACwAAAAAAQABAAACAkQBADs=\") repeat-x scroll 50% rgba(0,0,0,0);padding:.25rem 2.5rem}.p-tree.p-tree-horizontal .p-treenode.p-treenode-collapsed,.p-tree.p-tree-horizontal .p-treenode.p-treenode-leaf{padding-right:0}.p-tree.p-tree-horizontal .p-treenode-children{margin:0;padding:0}.p-tree.p-tree-horizontal .p-treenode-connector{width:1px}.p-tree.p-tree-horizontal .p-treenode-connector-table{height:100%;width:1px}.p-tree.p-tree-horizontal .p-treenode-connector-line{background:url(\"data:image/gif;base64,R0lGODlhAQABAIAAALGxsf///yH/C1hNUCBEYXRhWE1QPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4KPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNC4xLWMwMzQgNDYuMjcyOTc2LCBTYXQgSmFuIDI3IDIwMDcgMjI6Mzc6MzcgICAgICAgICI+CiAgIDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+CiAgICAgIDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiCiAgICAgICAgICAgIHhtbG5zOnhhcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyI+CiAgICAgICAgIDx4YXA6Q3JlYXRvclRvb2w+QWRvYmUgRmlyZXdvcmtzIENTMzwveGFwOkNyZWF0b3JUb29sPgogICAgICAgICA8eGFwOkNyZWF0ZURhdGU+MjAxMC0wMy0xMVQxMDoxNjo0MVo8L3hhcDpDcmVhdGVEYXRlPgogICAgICAgICA8eGFwOk1vZGlmeURhdGU+MjAxMC0wMy0xMVQxMjo0NDoxOVo8L3hhcDpNb2RpZnlEYXRlPgogICAgICA8L3JkZjpEZXNjcmlwdGlvbj4KICAgICAgPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIKICAgICAgICAgICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIj4KICAgICAgICAgPGRjOmZvcm1hdD5pbWFnZS9naWY8L2RjOmZvcm1hdD4KICAgICAgPC9yZGY6RGVzY3JpcHRpb24+CiAgIDwvcmRmOlJERj4KPC94OnhtcG1ldGE+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgCjw/eHBhY2tldCBlbmQ9InciPz4B//79/Pv6+fj39vX08/Lx8O/u7ezr6uno5+bl5OPi4eDf3t3c29rZ2NfW1dTT0tHQz87NzMvKycjHxsXEw8LBwL++vby7urm4t7a1tLOysbCvrq2sq6qpqKempaSjoqGgn56dnJuamZiXlpWUk5KRkI+OjYyLiomIh4aFhIOCgYB/fn18e3p5eHd2dXRzcnFwb25tbGtqaWhnZmVkY2JhYF9eXVxbWllYV1ZVVFNSUVBPTk1MS0pJSEdGRURDQkFAPz49PAA6OTg3NjU0MzIxMC8uLSwrKikoJyYlJCMiISAfHh0cGxoZGBcWFRQTEhEQDw4NDAsKCQgHBgUEAwIBAAAh+QQABwD/ACwAAAAAAQABAAACAkQBADs=\") repeat-y scroll 0 0 rgba(0,0,0,0);width:1px}.p-tree.p-tree-horizontal table{height:0}"]
            },] }
];
Tree.ctorParameters = () => [
    { type: ElementRef },
    { type: TreeDragDropService, decorators: [{ type: Optional }] }
];
Tree.propDecorators = {
    value: [{ type: Input }],
    selectionMode: [{ type: Input }],
    selection: [{ type: Input }],
    selectionChange: [{ type: Output }],
    onNodeSelect: [{ type: Output }],
    onNodeUnselect: [{ type: Output }],
    onNodeExpand: [{ type: Output }],
    onNodeCollapse: [{ type: Output }],
    onNodeContextMenuSelect: [{ type: Output }],
    onNodeDrop: [{ type: Output }],
    style: [{ type: Input }],
    styleClass: [{ type: Input }],
    contextMenu: [{ type: Input }],
    layout: [{ type: Input }],
    draggableScope: [{ type: Input }],
    droppableScope: [{ type: Input }],
    draggableNodes: [{ type: Input }],
    droppableNodes: [{ type: Input }],
    metaKeySelection: [{ type: Input }],
    propagateSelectionUp: [{ type: Input }],
    propagateSelectionDown: [{ type: Input }],
    loading: [{ type: Input }],
    loadingIcon: [{ type: Input }],
    emptyMessage: [{ type: Input }],
    ariaLabel: [{ type: Input }],
    ariaLabelledBy: [{ type: Input }],
    validateDrop: [{ type: Input }],
    filter: [{ type: Input }],
    filterBy: [{ type: Input }],
    filterMode: [{ type: Input }],
    filterPlaceholder: [{ type: Input }],
    filterLocale: [{ type: Input }],
    scrollHeight: [{ type: Input }],
    virtualScroll: [{ type: Input }],
    virtualNodeHeight: [{ type: Input }],
    minBufferPx: [{ type: Input }],
    maxBufferPx: [{ type: Input }],
    trackBy: [{ type: Input }],
    onFilter: [{ type: Output }],
    templates: [{ type: ContentChildren, args: [PrimeTemplate,] }]
};
export var DropType;
(function (DropType) {
    DropType[DropType["Both"] = 0] = "Both";
    DropType[DropType["DropPoint"] = 1] = "DropPoint";
    DropType[DropType["Node"] = 2] = "Node";
})(DropType || (DropType = {}));
export class TreeModule {
}
TreeModule.decorators = [
    { type: NgModule, args: [{
                imports: [CommonModule, ScrollingModule, RippleModule],
                exports: [Tree, SharedModule, ScrollingModule],
                declarations: [Tree, UITreeNode]
            },] }
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJlZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9hcHAvY29tcG9uZW50cy90cmVlL3RyZWUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFDLFFBQVEsRUFBQyxTQUFTLEVBQUMsS0FBSyxFQUE0QixNQUFNLEVBQUMsWUFBWSxFQUMzRSxlQUFlLEVBQXVCLE1BQU0sRUFBQyxVQUFVLEVBQUMsVUFBVSxFQUFDLHVCQUF1QixFQUFnQixpQkFBaUIsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUN0SixPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFDdkQsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUN2QyxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFJN0MsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLGFBQWEsQ0FBQztBQUN6QyxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sYUFBYSxDQUFDO0FBQzFDLE9BQU8sRUFBQyxtQkFBbUIsRUFBQyxNQUFNLGFBQWEsQ0FBQztBQUVoRCxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQzFDLE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSxhQUFhLENBQUM7QUFDekMsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBOEU1QyxNQUFNLE9BQU8sVUFBVTtJQXNCbkIsWUFBNEMsSUFBSTtRQUM1QyxJQUFJLENBQUMsSUFBSSxHQUFHLElBQVksQ0FBQztJQUM3QixDQUFDO0lBUUQsUUFBUTtRQUNKLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUM7UUFFbkMsSUFBSSxJQUFJLENBQUMsVUFBVSxFQUFFO1lBQ2pCLElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLElB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Q2xCLElBQUksV0FBVyxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1FBQzNGLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLGFBQWEsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUN0RCxJQUFJLFNBQVMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO1FBRTNCLElBQUksS0FBSyxDQUFDLFFBQVEsR0FBRyxDQUFDLEVBQUU7WUFDcEIsU0FBUyxHQUFHLENBQUMsS0FBSyxDQUFDLGdCQUFnQixLQUFLLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLGFBQWEsR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUM7WUFDM0ksV0FBVyxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztTQUNwRDthQUNJO1lBQ0QsU0FBUyxHQUFHLFdBQVcsQ0FBQyxNQUFNLENBQUM7WUFDL0IsV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7U0FDcEM7UUFFRCxJQUFJLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxRQUFRLENBQUM7WUFDL0IsSUFBSSxFQUFFLEtBQUssQ0FBQyxRQUFRO1lBQ3BCLFFBQVEsRUFBRSxLQUFLLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtB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QUFDLElBQUksRUFBQyxZQUFZLEVBQUMsZUFBZSxDQUFDO2dCQUM1QyxZQUFZLEVBQUUsQ0FBQyxJQUFJLEVBQUMsVUFBVSxDQUFDO2FBQ2xDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtOZ01vZHVsZSxDb21wb25lbnQsSW5wdXQsQWZ0ZXJDb250ZW50SW5pdCxPbkRlc3Ryb3ksT3V0cHV0LEV2ZW50RW1pdHRlcixPbkluaXQsT25DaGFuZ2VzLFxuICAgIENvbnRlbnRDaGlsZHJlbixRdWVyeUxpc3QsVGVtcGxhdGVSZWYsSW5qZWN0LEVsZW1lbnRSZWYsZm9yd2FyZFJlZixDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneSxTaW1wbGVDaGFuZ2VzLCBWaWV3RW5jYXBzdWxhdGlvbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge1Njcm9sbGluZ01vZHVsZX0gZnJvbSAnQGFuZ3VsYXIvY2RrL3Njcm9sbGluZyc7XG5pbXBvcnQge09wdGlvbmFsfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7Q29tbW9uTW9kdWxlfSBmcm9tICdAYW5ndWxhci9jb21tb24nO1xuaW1wb3J0IHtTdWJzY3JpcHRpb24sIFN1YmplY3R9ICAgZnJvbSAncnhqcyc7XG5pbXBvcnQgeyBmaXJzdCB9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcbmltcG9ydCB7VHJlZU5vZGV9IGZyb20gJ3ByaW1lbmcvYXBpJztcbmltcG9ydCB7U2hhcmVkTW9kdWxlfSBmcm9tICdwcmltZW5nL2FwaSc7XG5pbXBvcnQge1ByaW1lVGVtcGxhdGV9IGZyb20gJ3ByaW1lbmcvYXBpJztcbmltcG9ydCB7VHJlZURyYWdEcm9wU2VydmljZX0gZnJvbSAncHJpbWVuZy9hcGknO1xuaW1wb3J0IHtCbG9ja2FibGVVSX0gZnJvbSAncHJpbWVuZy9hcGknO1xuaW1wb3J0IHtPYmplY3RVdGlsc30gZnJvbSAncHJpbWVuZy91dGlscyc7XG5pbXBvcnQgeyBEb21IYW5kbGVyIH0gZnJvbSAncHJpbWVuZy9kb20nO1xuaW1wb3J0IHtSaXBwbGVNb2R1bGV9IGZyb20gJ3ByaW1lbmcvcmlwcGxlJztcblxuQENvbXBvbmVudCh7XG4gICAgc2VsZWN0b3I6ICdwLXRyZWVOb2RlJyxcbiAgICB0ZW1wbGF0ZTogYFxuICAgICAgICA8bmctdGVtcGxhdGUgW25nSWZdPVwibm9kZVwiPlxuICAgICAgICAgICAgPGxpICpuZ0lmPVwidHJlZS5kcm9wcGFibGVOb2Rlc1wiIGNsYXNzPVwicC10cmVlbm9kZS1kcm9wcG9pbnRcIiBbbmdDbGFzc109XCJ7J3AtdHJlZW5vZGUtZHJvcHBvaW50LWFjdGl2ZSc6ZHJhZ2hvdmVyUHJldn1cIlxuICAgICAgICAgICAgKGRyb3ApPVwib25Ecm9wUG9pbnQoJGV2ZW50LC0xKVwiIChkcmFnb3Zlcik9XCJvbkRyb3BQb2ludERyYWdPdmVyKCRldmVudClcIiAoZHJhZ2VudGVyKT1cIm9uRHJvcFBvaW50RHJhZ0VudGVyKCRldmVudCwtMSlcIiAoZHJhZ2xlYXZlKT1cIm9uRHJvcFBvaW50RHJhZ0xlYXZlKCRldmVudClcIj48L2xpPlxuICAgICAgICAgICAgPGxpICpuZ0lmPVwiIXRyZWUuaG9yaXpvbnRhbFwiIHJvbGU9XCJ0cmVlaXRlbVwiIFtuZ0NsYXNzXT1cIlsncC10cmVlbm9kZScsbm9kZS5zdHlsZUNsYXNzfHwnJywgaXNMZWFmKCkgPyAncC10cmVlbm9kZS1sZWFmJzogJyddXCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInAtdHJlZW5vZGUtY29udGVudFwiIChjbGljayk9XCJvbk5vZGVDbGljaygkZXZlbnQpXCIgKGNvbnRleHRtZW51KT1cIm9uTm9kZVJpZ2h0Q2xpY2soJGV2ZW50KVwiICh0b3VjaGVuZCk9XCJvbk5vZGVUb3VjaEVuZCgpXCJcbiAgICAgICAgICAgICAgICAgICAgKGRyb3ApPVwib25Ecm9wTm9kZSgkZXZlbnQpXCIgKGRyYWdvdmVyKT1cIm9uRHJvcE5vZGVEcmFnT3ZlcigkZXZlbnQpXCIgKGRyYWdlbnRlcik9XCJvbkRyb3BOb2RlRHJhZ0VudGVyKCRldmVudClcIiAoZHJhZ2xlYXZlKT1cIm9uRHJvcE5vZGVEcmFnTGVhdmUoJGV2ZW50KVwiXG4gICAgICAgICAgICAgICAgICAgIFtkcmFnZ2FibGVdPVwidHJlZS5kcmFnZ2FibGVOb2Rlc1wiIChkcmFnc3RhcnQpPVwib25EcmFnU3RhcnQoJGV2ZW50KVwiIChkcmFnZW5kKT1cIm9uRHJhZ1N0b3AoJGV2ZW50KVwiIFthdHRyLnRhYmluZGV4XT1cIjBcIlxuICAgICAgICAgICAgICAgICAgICBbbmdDbGFzc109XCJ7J3AtdHJlZW5vZGUtc2VsZWN0YWJsZSc6dHJlZS5zZWxlY3Rpb25Nb2RlICYmIG5vZGUuc2VsZWN0YWJsZSAhPT0gZmFsc2UsJ3AtdHJlZW5vZGUtZHJhZ292ZXInOmRyYWdob3Zlck5vZGUsICdwLWhpZ2hsaWdodCc6aXNTZWxlY3RlZCgpfVwiXG4gICAgICAgICAgICAgICAgICAgIChrZXlkb3duKT1cIm9uS2V5RG93bigkZXZlbnQpXCIgW2F0dHIuYXJpYS1wb3NpbnNldF09XCJ0aGlzLmluZGV4ICsgMVwiIFthdHRyLmFyaWEtZXhwYW5kZWRdPVwidGhpcy5ub2RlLmV4cGFuZGVkXCIgW2F0dHIuYXJpYS1zZWxlY3RlZF09XCJpc1NlbGVjdGVkKClcIiBbYXR0ci5hcmlhLWxhYmVsXT1cIm5vZGUubGFiZWxcIj5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJwLXRyZWUtdG9nZ2xlciBwLWxpbmtcIiAoY2xpY2spPVwidG9nZ2xlKCRldmVudClcIiBwUmlwcGxlPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJwLXRyZWUtdG9nZ2xlci1pY29uIHBpIHBpLWZ3XCIgW25nQ2xhc3NdPVwieydwaS1jaGV2cm9uLXJpZ2h0Jzohbm9kZS5leHBhbmRlZCwncGktY2hldnJvbi1kb3duJzpub2RlLmV4cGFuZGVkfVwiPjwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwicC1jaGVja2JveCBwLWNvbXBvbmVudFwiICpuZ0lmPVwidHJlZS5zZWxlY3Rpb25Nb2RlID09ICdjaGVja2JveCdcIiBbYXR0ci5hcmlhLWNoZWNrZWRdPVwiaXNTZWxlY3RlZCgpXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwicC1jaGVja2JveC1ib3hcIiBbbmdDbGFzc109XCJ7J3AtaGlnaGxpZ2h0JzogaXNTZWxlY3RlZCgpLCAncC1pbmRldGVybWluYXRlJzogbm9kZS5wYXJ0aWFsU2VsZWN0ZWR9XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJwLWNoZWNrYm94LWljb24gcGlcIiBbbmdDbGFzc109XCJ7J3BpLWNoZWNrJzppc1NlbGVjdGVkKCksJ3BpLW1pbnVzJzpub2RlLnBhcnRpYWxTZWxlY3RlZH1cIj48L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIFtjbGFzc109XCJnZXRJY29uKClcIiAqbmdJZj1cIm5vZGUuaWNvbnx8bm9kZS5leHBhbmRlZEljb258fG5vZGUuY29sbGFwc2VkSWNvblwiPjwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJwLXRyZWVub2RlLWxhYmVsXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gKm5nSWY9XCIhdHJlZS5nZXRUZW1wbGF0ZUZvck5vZGUobm9kZSlcIj57e25vZGUubGFiZWx9fTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiAqbmdJZj1cInRyZWUuZ2V0VGVtcGxhdGVGb3JOb2RlKG5vZGUpXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxuZy1jb250YWluZXIgKm5nVGVtcGxhdGVPdXRsZXQ9XCJ0cmVlLmdldFRlbXBsYXRlRm9yTm9kZShub2RlKTsgY29udGV4dDogeyRpbXBsaWNpdDogbm9kZX1cIj48L25nLWNvbnRhaW5lcj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8dWwgY2xhc3M9XCJwLXRyZWVub2RlLWNoaWxkcmVuXCIgc3R5bGU9XCJkaXNwbGF5OiBub25lO1wiICpuZ0lmPVwiIXRyZWUudmlydHVhbFNjcm9sbCAmJiBub2RlLmNoaWxkcmVuICYmIG5vZGUuZXhwYW5kZWRcIiBbc3R5bGUuZGlzcGxheV09XCJub2RlLmV4cGFuZGVkID8gJ2Jsb2NrJyA6ICdub25lJ1wiIHJvbGU9XCJncm91cFwiPlxuICAgICAgICAgICAgICAgICAgICA8cC10cmVlTm9kZSAqbmdGb3I9XCJsZXQgY2hpbGROb2RlIG9mIG5vZGUuY2hpbGRyZW47bGV0IGZpcnN0Q2hpbGQ9Zmlyc3Q7bGV0IGxhc3RDaGlsZD1sYXN0OyBsZXQgaW5kZXg9aW5kZXg7IHRyYWNrQnk6IHRyZWUudHJhY2tCeVwiIFtub2RlXT1cImNoaWxkTm9kZVwiIFtwYXJlbnROb2RlXT1cIm5vZGVcIlxuICAgICAgICAgICAgICAgICAgICAgICAgW2ZpcnN0Q2hpbGRdPVwiZmlyc3RDaGlsZFwiIFtsYXN0Q2hpbGRdPVwibGFzdENoaWxkXCIgW2luZGV4XT1cImluZGV4XCIgW3N0eWxlLmhlaWdodC5weF09XCJ0cmVlLnZpcnR1YWxOb2RlSGVpZ2h0XCIgW2xldmVsXT1cImxldmVsICsgMVwiPjwvcC10cmVlTm9kZT5cbiAgICAgICAgICAgICAgICA8L3VsPlxuICAgICAgICAgICAgPC9saT5cbiAgICAgICAgICAgIDxsaSAqbmdJZj1cInRyZWUuZHJvcHBhYmxlTm9kZXMmJmxhc3RDaGlsZFwiIGNsYXNzPVwicC10cmVlbm9kZS1kcm9wcG9pbnRcIiBbbmdDbGFzc109XCJ7J3AtdHJlZW5vZGUtZHJvcHBvaW50LWFjdGl2ZSc6ZHJhZ2hvdmVyTmV4dH1cIlxuICAgICAgICAgICAgKGRyb3ApPVwib25Ecm9wUG9pbnQoJGV2ZW50LDEpXCIgKGRyYWdvdmVyKT1cIm9uRHJvcFBvaW50RHJhZ092ZXIoJGV2ZW50KVwiIChkcmFnZW50ZXIpPVwib25Ecm9wUG9pbnREcmFnRW50ZXIoJGV2ZW50LDEpXCIgKGRyYWdsZWF2ZSk9XCJvbkRyb3BQb2ludERyYWdMZWF2ZSgkZXZlbnQpXCI+PC9saT5cbiAgICAgICAgICAgIDx0YWJsZSAqbmdJZj1cInRyZWUuaG9yaXpvbnRhbFwiIFtjbGFzc109XCJub2RlLnN0eWxlQ2xhc3NcIj5cbiAgICAgICAgICAgICAgICA8dGJvZHk+XG4gICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzcz1cInAtdHJlZW5vZGUtY29ubmVjdG9yXCIgKm5nSWY9XCIhcm9vdFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0YWJsZSBjbGFzcz1cInAtdHJlZW5vZGUtY29ubmVjdG9yLXRhYmxlXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0Ym9keT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgW25nQ2xhc3NdPVwieydwLXRyZWVub2RlLWNvbm5lY3Rvci1saW5lJzohZmlyc3RDaGlsZH1cIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgW25nQ2xhc3NdPVwieydwLXRyZWVub2RlLWNvbm5lY3Rvci1saW5lJzohbGFzdENoaWxkfVwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3Rib2R5PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdGFibGU+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzPVwicC10cmVlbm9kZVwiIFtuZ0NsYXNzXT1cInsncC10cmVlbm9kZS1jb2xsYXBzZWQnOiFub2RlLmV4cGFuZGVkfVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJwLXRyZWVub2RlLWNvbnRlbnRcIiB0YWJpbmRleD1cIjBcIiBbbmdDbGFzc109XCJ7J3AtdHJlZW5vZGUtc2VsZWN0YWJsZSc6dHJlZS5zZWxlY3Rpb25Nb2RlLCdwLWhpZ2hsaWdodCc6aXNTZWxlY3RlZCgpfVwiIChjbGljayk9XCJvbk5vZGVDbGljaygkZXZlbnQpXCIgKGNvbnRleHRtZW51KT1cIm9uTm9kZVJpZ2h0Q2xpY2soJGV2ZW50KVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICh0b3VjaGVuZCk9XCJvbk5vZGVUb3VjaEVuZCgpXCIgKGtleWRvd24pPVwib25Ob2RlS2V5ZG93bigkZXZlbnQpXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwicC10cmVlLXRvZ2dsZXIgcGkgcGktZndcIiBbbmdDbGFzc109XCJ7J3BpLXBsdXMnOiFub2RlLmV4cGFuZGVkLCdwaS1taW51cyc6bm9kZS5leHBhbmRlZH1cIiAqbmdJZj1cIiFpc0xlYWYoKVwiIChjbGljayk9XCJ0b2dnbGUoJGV2ZW50KVwiPjwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gW2NsYXNzXT1cImdldEljb24oKVwiICpuZ0lmPVwibm9kZS5pY29ufHxub2RlLmV4cGFuZGVkSWNvbnx8bm9kZS5jb2xsYXBzZWRJY29uXCI+PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cInAtdHJlZW5vZGUtbGFiZWxcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuICpuZ0lmPVwiIXRyZWUuZ2V0VGVtcGxhdGVGb3JOb2RlKG5vZGUpXCI+e3tub2RlLmxhYmVsfX08L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiAqbmdJZj1cInRyZWUuZ2V0VGVtcGxhdGVGb3JOb2RlKG5vZGUpXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPG5nLWNvbnRhaW5lciAqbmdUZW1wbGF0ZU91dGxldD1cInRyZWUuZ2V0VGVtcGxhdGVGb3JOb2RlKG5vZGUpOyBjb250ZXh0OiB7JGltcGxpY2l0OiBub2RlfVwiPjwvbmctY29udGFpbmVyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzPVwicC10cmVlbm9kZS1jaGlsZHJlbi1jb250YWluZXJcIiAqbmdJZj1cIm5vZGUuY2hpbGRyZW4gJiYgbm9kZS5leHBhbmRlZFwiIFtzdHlsZS5kaXNwbGF5XT1cIm5vZGUuZXhwYW5kZWQgPyAndGFibGUtY2VsbCcgOiAnbm9uZSdcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwicC10cmVlbm9kZS1jaGlsZHJlblwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8cC10cmVlTm9kZSAqbmdGb3I9XCJsZXQgY2hpbGROb2RlIG9mIG5vZGUuY2hpbGRyZW47bGV0IGZpcnN0Q2hpbGQ9Zmlyc3Q7bGV0IGxhc3RDaGlsZD1sYXN0OyB0cmFja0J5OiB0cmVlLnRyYWNrQnlcIiBbbm9kZV09XCJjaGlsZE5vZGVcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFtmaXJzdENoaWxkXT1cImZpcnN0Q2hpbGRcIiBbbGFzdENoaWxkXT1cImxhc3RDaGlsZFwiPjwvcC10cmVlTm9kZT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvdGQ+XG4gICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgPC90Ym9keT5cbiAgICAgICAgICAgIDwvdGFibGU+XG4gICAgICAgIDwvbmctdGVtcGxhdGU+XG4gICAgYCxcbiAgICBlbmNhcHN1bGF0aW9uOiBWaWV3RW5jYXBzdWxhdGlvbi5Ob25lXG59KVxuZXhwb3J0IGNsYXNzIFVJVHJlZU5vZGUgaW1wbGVtZW50cyBPbkluaXQge1xuXG4gICAgc3RhdGljIElDT05fQ0xBU1M6IHN0cmluZyA9ICdwLXRyZWVub2RlLWljb24gJztcblxuICAgIEBJbnB1dCgpIHJvd05vZGU6IGFueTtcblxuICAgIEBJbnB1dCgpIG5vZGU6IFRyZWVOb2RlO1xuXG4gICAgQElucHV0KCkgcGFyZW50Tm9kZTogVHJlZU5vZGU7XG5cbiAgICBASW5wdXQoKSByb290OiBib29sZWFuO1xuXG4gICAgQElucHV0KCkgaW5kZXg6IG51bWJlcjtcblxuICAgIEBJbnB1dCgpIGZpcnN0Q2hpbGQ6IGJvb2xlYW47XG5cbiAgICBASW5wdXQoKSBsYXN0Q2hpbGQ6IGJvb2xlYW47XG5cbiAgICBASW5wdXQoKSBsZXZlbDogbnVtYmVyO1xuXG4gICAgdHJlZTogVHJlZTtcblxuICAgIGNvbnN0cnVjdG9yKEBJbmplY3QoZm9yd2FyZFJlZigoKSA9PiBUcmVlKSkgdHJlZSkge1xuICAgICAgICB0aGlzLnRyZWUgPSB0cmVlIGFzIFRyZWU7XG4gICAgfVxuXG4gICAgZHJhZ2hvdmVyUHJldjogYm9vbGVhbjtcblxuICAgIGRyYWdob3Zlck5leHQ6IGJvb2xlYW47XG5cbiAgICBkcmFnaG92ZXJOb2RlOiBib29sZWFuXG5cbiAgICBuZ09uSW5pdCgpIHtcbiAgICAgICAgdGhpcy5ub2RlLnBhcmVudCA9IHRoaXMucGFyZW50Tm9kZTtcblxuICAgICAgICBpZiAodGhpcy5wYXJlbnROb2RlKSB7XG4gICAgICAgICAgICB0aGlzLnRyZWUuc3luY05vZGVPcHRpb24odGhpcy5ub2RlLCB0aGlzLnRyZWUudmFsdWUsICdwYXJlbnQnLCB0aGlzLnRyZWUuZ2V0Tm9kZVdpdGhLZXkodGhpcy5wYXJlbnROb2RlLmtleSwgdGhpcy50cmVlLnZhbHVlKSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBnZXRJY29uKCkge1xuICAgICAgICBsZXQgaWNvbjogc3RyaW5nO1xuXG4gICAgICAgIGlmICh0aGlzLm5vZGUuaWNvbilcbiAgICAgICAgICAgIGljb24gPSB0aGlzLm5vZGUuaWNvbjtcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgaWNvbiA9IHRoaXMubm9kZS5leHBhbmRlZCAmJiB0aGlzLm5vZGUuY2hpbGRyZW4gJiYgdGhpcy5ub2RlLmNoaWxkcmVuLmxlbmd0aCA/IHRoaXMubm9kZS5leHBhbmRlZEljb24gOiB0aGlzLm5vZGUuY29sbGFwc2VkSWNvbjtcblxuICAgICAgICByZXR1cm4gVUlUcmVlTm9kZS5JQ09OX0NMQVNTICsgJyAnICsgaWNvbjtcbiAgICB9XG5cbiAgICBpc0xlYWYoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnRyZWUuaXNOb2RlTGVhZih0aGlzLm5vZGUpO1xuICAgIH1cblxuICAgIHRvZ2dsZShldmVudDogRXZlbnQpIHtcbiAgICAgICAgaWYgKHRoaXMubm9kZS5leHBhbmRlZClcbiAgICAgICAgICAgIHRoaXMuY29sbGFwc2UoZXZlbnQpO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICB0aGlzLmV4cGFuZChldmVudCk7XG4gICAgfVxuXG4gICAgZXhwYW5kKGV2ZW50OiBFdmVudCkge1xuICAgICAgICB0aGlzLm5vZGUuZXhwYW5kZWQgPSB0cnVlO1xuICAgICAgICBpZiAodGhpcy50cmVlLnZpcnR1YWxTY3JvbGwpIHtcbiAgICAgICAgICAgIHRoaXMudHJlZS51cGRhdGVTZXJpYWxpemVkVmFsdWUoKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnRyZWUub25Ob2RlRXhwYW5kLmVtaXQoe29yaWdpbmFsRXZlbnQ6IGV2ZW50LCBub2RlOiB0aGlzLm5vZGV9KTtcbiAgICB9XG5cbiAgICBjb2xsYXBzZShldmVudDogRXZlbnQpIHtcbiAgICAgICAgdGhpcy5ub2RlLmV4cGFuZGVkID0gZmFsc2U7XG4gICAgICAgIGlmICh0aGlzLnRyZWUudmlydHVhbFNjcm9sbCkge1xuICAgICAgICAgICAgdGhpcy50cmVlLnVwZGF0ZVNlcmlhbGl6ZWRWYWx1ZSgpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMudHJlZS5vbk5vZGVDb2xsYXBzZS5lbWl0KHtvcmlnaW5hbEV2ZW50OiBldmVudCwgbm9kZTogdGhpcy5ub2RlfSk7XG4gICAgfVxuXG4gICAgb25Ob2RlQ2xpY2soZXZlbnQ6IE1vdXNlRXZlbnQpIHtcbiAgICAgICAgdGhpcy50cmVlLm9uTm9kZUNsaWNrKGV2ZW50LCB0aGlzLm5vZGUpO1xuICAgIH1cblxuICAgIG9uTm9kZUtleWRvd24oZXZlbnQ6IEtleWJvYXJkRXZlbnQpIHtcbiAgICAgICAgaWYgKGV2ZW50LndoaWNoID09PSAxMykge1xuICAgICAgICAgICAgdGhpcy50cmVlLm9uTm9kZUNsaWNrKGV2ZW50LCB0aGlzLm5vZGUpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgb25Ob2RlVG91Y2hFbmQoKSB7XG4gICAgICAgIHRoaXMudHJlZS5vbk5vZGVUb3VjaEVuZCgpO1xuICAgIH1cblxuICAgIG9uTm9kZVJpZ2h0Q2xpY2soZXZlbnQ6IE1vdXNlRXZlbnQpIHtcbiAgICAgICAgdGhpcy50cmVlLm9uTm9kZVJpZ2h0Q2xpY2soZXZlbnQsIHRoaXMubm9kZSk7XG4gICAgfVxuXG4gICAgaXNTZWxlY3RlZCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudHJlZS5pc1NlbGVjdGVkKHRoaXMubm9kZSk7XG4gICAgfVxuXG4gICAgb25Ecm9wUG9pbnQoZXZlbnQ6IEV2ZW50LCBwb3NpdGlvbjogbnVtYmVyKSB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGxldCBkcmFnTm9kZSA9IHRoaXMudHJlZS5kcmFnTm9kZTtcbiAgICAgICAgbGV0IGRyYWdOb2RlSW5kZXggPSB0aGlzLnRyZWUuZHJhZ05vZGVJbmRleDtcbiAgICAgICAgbGV0IGRyYWdOb2RlU2NvcGUgPSB0aGlzLnRyZWUuZHJhZ05vZGVTY29wZTtcbiAgICAgICAgbGV0IGlzVmFsaWREcm9wUG9pbnRJbmRleCA9IHRoaXMudHJlZS5kcmFnTm9kZVRyZWUgPT09IHRoaXMudHJlZSA/IChwb3NpdGlvbiA9PT0gMSB8fCBkcmFnTm9kZUluZGV4ICE9PSB0aGlzLmluZGV4IC0gMSkgOiB0cnVlO1xuXG4gICAgICAgIGlmKHRoaXMudHJlZS5hbGxvd0Ryb3AoZHJhZ05vZGUsIHRoaXMubm9kZSwgZHJhZ05vZGVTY29wZSwgRHJvcFR5cGUuRHJvcFBvaW50KSAmJiBpc1ZhbGlkRHJvcFBvaW50SW5kZXgpIHtcbiAgICAgICAgICAgIGxldCBkcm9wUGFyYW1zID0gey4uLnRoaXMuY3JlYXRlRHJvcFBvaW50RXZlbnRNZXRhZGF0YShwb3NpdGlvbil9O1xuXG4gICAgICAgICAgICBpZiAodGhpcy50cmVlLnZhbGlkYXRlRHJvcCkge1xuICAgICAgICAgICAgICAgIC8vIGxldCBuZXdOb2RlTGlzdCA9IHRoaXMubm9kZS5wYXJlbnQgPyB0aGlzLm5vZGUucGFyZW50LmNoaWxkcmVuIDogdGhpcy50cmVlLnZhbHVlO1xuICAgICAgICAgICAgICAgIC8vIGxldCBkcm9wSW5kZXggPSB0aGlzLmluZGV4O1xuICAgICAgICAgICAgICAgIC8vIGNvbnN0IHJlc29sdmUgPSBuZXcgU3ViamVjdDxib29sZWFuPigpO1xuXG4gICAgICAgICAgICAgICAgLy8gcmVzb2x2ZS5waXBlKGZpcnN0KCkpLnN1YnNjcmliZShwcm9jZWVkID0+IHtcbiAgICAgICAgICAgICAgICAvLyAgICAgaWYgKHByb2NlZWQgIT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgLy8gICAgICAgICB0aGlzLnRyZWUuZHJhZ05vZGVTdWJOb2Rlcy5zcGxpY2UoZHJhZ05vZGVJbmRleCwgMSk7XG5cbiAgICAgICAgICAgICAgICAvLyAgICAgICAgIGlmIChwb3NpdGlvbiA8IDApIHtcbiAgICAgICAgICAgICAgICAvLyAgICAgICAgICAgICBkcm9wSW5kZXggPSAodGhpcy50cmVlLmRyYWdOb2RlU3ViTm9kZXMgPT09IG5ld05vZGVMaXN0KSA/ICgodGhpcy50cmVlLmRyYWdOb2RlSW5kZXggPiB0aGlzLmluZGV4KSA/IHRoaXMuaW5kZXggOiB0aGlzLmluZGV4IC0gMSkgOiB0aGlzLmluZGV4O1xuICAgICAgICAgICAgICAgIC8vICAgICAgICAgICAgIG5ld05vZGVMaXN0LnNwbGljZShkcm9wSW5kZXgsIDAsIGRyYWdOb2RlKTtcbiAgICAgICAgICAgICAgICAvLyAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vICAgICAgICAgICAgIGRyb3BJbmRleCA9IG5ld05vZGVMaXN0Lmxlbmd0aDtcbiAgICAgICAgICAgICAgICAvLyAgICAgICAgICAgICBuZXdOb2RlTGlzdC5wdXNoKGRyYWdOb2RlKTtcbiAgICAgICAgICAgICAgICAvLyAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gICAgIHRoaXMudHJlZS5kcmFnRHJvcFNlcnZpY2Uuc3RvcERyYWcoe1xuICAgICAgICAgICAgICAgIC8vICAgICAgICAgbm9kZTogZHJhZ05vZGUsXG4gICAgICAgICAgICAgICAgLy8gICAgICAgICBzdWJOb2RlczogdGhpcy5ub2RlLnBhcmVudCA/IHRoaXMubm9kZS5wYXJlbnQuY2hpbGRyZW4gOiB0aGlzLnRyZWUudmFsdWUsXG4gICAgICAgICAgICAgICAgLy8gICAgICAgICBpbmRleDogZHJhZ05vZGVJbmRleFxuICAgICAgICAgICAgICAgIC8vICAgICB9KTtcblxuICAgICAgICAgICAgICAgIC8vICAgICBsZXQgbmV3Tm9kZUxpc3QgPSBldmVudC5kcm9wTm9kZS5wYXJlbnQgPyBldmVudC5kcm9wTm9kZS5wYXJlbnQuY2hpbGRyZW4gOiB0aGlzLnRyZWUudmFsdWU7XG4gICAgICAgICAgICAgICAgLy8gICAgIGV2ZW50LmRyYWdOb2RlU3ViTm9kZXMuc3BsaWNlKGV2ZW50LmRyYWdOb2RlSW5kZXgsIDEpO1xuICAgICAgICAgICAgICAgIC8vICAgICBsZXQgZHJvcEluZGV4ID0gdGhpcy5pbmRleDtcblxuICAgICAgICAgICAgICAgIC8vICAgICBpZiAoZXZlbnQucG9zaXRpb24gPCAwKSB7XG4gICAgICAgICAgICAgICAgLy8gICAgICAgICBkcm9wSW5kZXggPSAoZXZlbnQuZHJhZ05vZGVTdWJOb2RlcyA9PT0gbmV3Tm9kZUxpc3QpID8gKChldmVudC5kcmFnTm9kZUluZGV4ID4gZXZlbnQuaW5kZXgpID8gZXZlbnQuaW5kZXggOiBldmVudC5pbmRleCAtIDEpIDogZXZlbnQuaW5kZXg7XG4gICAgICAgICAgICAgICAgLy8gICAgICAgICBuZXdOb2RlTGlzdC5zcGxpY2UoZHJvcEluZGV4LCAwLCBldmVudC5kcmFnTm9kZSk7XG4gICAgICAgICAgICAgICAgLy8gICAgIH1cbiAgICAgICAgICAgICAgICAvLyAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gICAgICAgICBkcm9wSW5kZXggPSBuZXdOb2RlTGlzdC5sZW5ndGg7XG4gICAgICAgICAgICAgICAgLy8gICAgICAgICBuZXdOb2RlTGlzdC5wdXNoKGV2ZW50LmRyYWdOb2RlKTtcbiAgICAgICAgICAgICAgICAvLyAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gICAgIHRoaXMudHJlZS5kcmFnRHJvcFNlcnZpY2Uuc3RvcERyYWcoe1xuICAgICAgICAgICAgICAgIC8vICAgICAgICAgbm9kZTogZXZlbnQuZHJhZ05vZGUsXG4gICAgICAgICAgICAgICAgLy8gICAgICAgICBzdWJOb2RlczogZXZlbnQuZHJvcE5vZGUucGFyZW50ID8gZXZlbnQuZHJvcE5vZGUucGFyZW50LmNoaWxkcmVuIDogdGhpcy50cmVlLnZhbHVlLFxuICAgICAgICAgICAgICAgIC8vICAgICAgICAgaW5kZXg6IGV2ZW50LmRyYWdOb2RlSW5kZXhcbiAgICAgICAgICAgICAgICAvLyAgICAgfSk7XG4gICAgICAgICAgICAgICAgLy8gfSk7XG5cbiAgICAgICAgICAgICAgICAvLyB0aGlzLnRyZWUub25Ob2RlRHJvcC5lbWl0KHtcbiAgICAgICAgICAgIC8vICAgICBvcmlnaW5hbEV2ZW50OiBldmVudCxcbiAgICAgICAgICAgIC8vICAgICBkcmFnTm9kZTogZHJhZ05vZGUsXG4gICAgICAgICAgICAvLyAgICAgZHJvcE5vZGU6IHRoaXMubm9kZSxcbiAgICAgICAgICAgIC8vICAgICBkcm9wSW5kZXg6IGRyb3BJbmRleCxcbiAgICAgICAgICAgIC8vICAgICBwcm9jZWVkOiByZXNvbHZlXG4gICAgICAgICAgICAvLyB9KTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB0aGlzLnRyZWUub25Ob2RlRHJvcC5lbWl0KHtcbiAgICAgICAgICAgICAgICAgICAgb3JpZ2luYWxFdmVudDogZXZlbnQsXG4gICAgICAgICAgICAgICAgICAgIGRyYWdOb2RlOiBkcmFnTm9kZSxcbiAgICAgICAgICAgICAgICAgICAgZHJvcE5vZGU6IHRoaXMubm9kZSxcbiAgICAgICAgICAgICAgICAgICAgZHJvcEluZGV4OiB0aGlzLmluZGV4LFxuICAgICAgICAgICAgICAgICAgICBhY2NlcHQ6ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucHJvY2Vzc1BvaW50RHJvcChkcm9wUGFyYW1zKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wcm9jZXNzUG9pbnREcm9wKGRyb3BQYXJhbXMpO1xuICAgICAgICAgICAgICAgIHRoaXMudHJlZS5vbk5vZGVEcm9wLmVtaXQoe1xuICAgICAgICAgICAgICAgICAgICBvcmlnaW5hbEV2ZW50OiBldmVudCxcbiAgICAgICAgICAgICAgICAgICAgZHJhZ05vZGU6IGRyYWdOb2RlLFxuICAgICAgICAgICAgICAgICAgICBkcm9wTm9kZTogdGhpcy5ub2RlLFxuICAgICAgICAgICAgICAgICAgICBkcm9wSW5kZXg6IHRoaXMuaW5kZXhcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuZHJhZ2hvdmVyUHJldiA9IGZhbHNlO1xuICAgICAgICB0aGlzLmRyYWdob3Zlck5leHQgPSBmYWxzZTtcbiAgICB9XG5cbiAgICBwcm9jZXNzUG9pbnREcm9wKGV2ZW50KSB7XG4gICAgICAgIGxldCBuZXdOb2RlTGlzdCA9IGV2ZW50LmRyb3BOb2RlLnBhcmVudCA/IGV2ZW50LmRyb3BOb2RlLnBhcmVudC5jaGlsZHJlbiA6IHRoaXMudHJlZS52YWx1ZTtcbiAgICAgICAgZXZlbnQuZHJhZ05vZGVTdWJOb2Rlcy5zcGxpY2UoZXZlbnQuZHJhZ05vZGVJbmRleCwgMSk7XG4gICAgICAgIGxldCBkcm9wSW5kZXggPSB0aGlzLmluZGV4O1xuXG4gICAgICAgIGlmIChldmVudC5wb3NpdGlvbiA8IDApIHtcbiAgICAgICAgICAgIGRyb3BJbmRleCA9IChldmVudC5kcmFnTm9kZVN1Yk5vZGVzID09PSBuZXdOb2RlTGlzdCkgPyAoKGV2ZW50LmRyYWdOb2RlSW5kZXggPiBldmVudC5pbmRleCkgPyBldmVudC5pbmRleCA6IGV2ZW50LmluZGV4IC0gMSkgOiBldmVudC5pbmRleDtcbiAgICAgICAgICAgIG5ld05vZGVMaXN0LnNwbGljZShkcm9wSW5kZXgsIDAsIGV2ZW50LmRyYWdOb2RlKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGRyb3BJbmRleCA9IG5ld05vZGVMaXN0Lmxlbmd0aDtcbiAgICAgICAgICAgIG5ld05vZGVMaXN0LnB1c2goZXZlbnQuZHJhZ05vZGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy50cmVlLmRyYWdEcm9wU2VydmljZS5zdG9wRHJhZyh7XG4gICAgICAgICAgICBub2RlOiBldmVudC5kcmFnTm9kZSxcbiAgICAgICAgICAgIHN1Yk5vZGVzOiBldmVudC5kcm9wTm9kZS5wYXJlbnQgPyBldmVudC5kcm9wTm9kZS5wYXJlbnQuY2hpbGRyZW4gOiB0aGlzLnRyZWUudmFsdWUsXG4gICAgICAgICAgICBpbmRleDogZXZlbnQuZHJhZ05vZGVJbmRleFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBjcmVhdGVEcm9wUG9pbnRFdmVudE1ldGFkYXRhKHBvc2l0aW9uKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBkcmFnTm9kZTogdGhpcy50cmVlLmRyYWdOb2RlLFxuICAgICAgICAgICAgZHJhZ05vZGVJbmRleDogIHRoaXMudHJlZS5kcmFnTm9kZUluZGV4LFxuICAgICAgICAgICAgZHJhZ05vZGVTdWJOb2RlczogdGhpcy50cmVlLmRyYWdOb2RlU3ViTm9kZXMsXG4gICAgICAgICAgICBkcm9wTm9kZTogdGhpcy5ub2RlLFxuICAgICAgICAgICAgaW5kZXg6IHRoaXMuaW5kZXgsXG4gICAgICAgICAgICBwb3NpdGlvbjogcG9zaXRpb25cbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBvbkRyb3BQb2ludERyYWdPdmVyKGV2ZW50KSB7XG4gICAgICAgIGV2ZW50LmRhdGFUcmFuc2Zlci5kcm9wRWZmZWN0ID0gJ21vdmUnO1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIH1cblxuICAgIG9uRHJvcFBvaW50RHJhZ0VudGVyKGV2ZW50OiBFdmVudCwgcG9zaXRpb246IG51bWJlcikge1xuICAgICAgICBpZih0aGlzLnRyZWUuYWxsb3dEcm9wKHRoaXMudHJlZS5kcmFnTm9kZSwgdGhpcy5ub2RlLCB0aGlzLnRyZWUuZHJhZ05vZGVTY29wZSwgRHJvcFR5cGUuRHJvcFBvaW50KSkge1xuICAgICAgICAgICAgaWYocG9zaXRpb24gPCAwKVxuICAgICAgICAgICAgICAgIHRoaXMuZHJhZ2hvdmVyUHJldiA9IHRydWU7XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgdGhpcy5kcmFnaG92ZXJOZXh0ID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIG9uRHJvcFBvaW50RHJhZ0xlYXZlKGV2ZW50OiBFdmVudCkge1xuICAgICAgICB0aGlzLmRyYWdob3ZlclByZXYgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5kcmFnaG92ZXJOZXh0ID0gZmFsc2U7XG4gICAgfVxuXG4gICAgb25EcmFnU3RhcnQoZXZlbnQpIHtcbiAgICAgICAgaWYgKHRoaXMudHJlZS5kcmFnZ2FibGVOb2RlcyAmJiB0aGlzLm5vZGUuZHJhZ2dhYmxlICE9PSBmYWxzZSkge1xuICAgICAgICAgICAgZXZlbnQuZGF0YVRyYW5zZmVyLnNldERhdGEoXCJ0ZXh0XCIsIFwiZGF0YVwiKTtcblxuICAgICAgICAgICAgdGhpcy50cmVlLmRyYWdEcm9wU2VydmljZS5zdGFydERyYWcoe1xuICAgICAgICAgICAgICAgIHRyZWU6IHRoaXMsXG4gICAgICAgICAgICAgICAgbm9kZTogdGhpcy5ub2RlLFxuICAgICAgICAgICAgICAgIHN1Yk5vZGVzOiB0aGlzLm5vZGUucGFyZW50ID8gdGhpcy5ub2RlLnBhcmVudC5jaGlsZHJlbiA6IHRoaXMudHJlZS52YWx1ZSxcbiAgICAgICAgICAgICAgICBpbmRleDogdGhpcy5pbmRleCxcbiAgICAgICAgICAgICAgICBzY29wZTogdGhpcy50cmVlLmRyYWdnYWJsZVNjb3BlXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBvbkRyYWdTdG9wKGV2ZW50KSB7XG4gICAgICAgIHRoaXMudHJlZS5kcmFnRHJvcFNlcnZpY2Uuc3RvcERyYWcoe1xuICAgICAgICAgICAgbm9kZTogdGhpcy5ub2RlLFxuICAgICAgICAgICAgc3ViTm9kZXM6IHRoaXMubm9kZS5wYXJlbnQgPyB0aGlzLm5vZGUucGFyZW50LmNoaWxkcmVuIDogdGhpcy50cmVlLnZhbHVlLFxuICAgICAgICAgICAgaW5kZXg6IHRoaXMuaW5kZXhcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgb25Ecm9wTm9kZURyYWdPdmVyKGV2ZW50KSB7XG4gICAgICAgIGV2ZW50LmRhdGFUcmFuc2Zlci5kcm9wRWZmZWN0ID0gJ21vdmUnO1xuICAgICAgICBpZiAodGhpcy50cmVlLmRyb3BwYWJsZU5vZGVzKSB7XG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBvbkRyb3BOb2RlKGV2ZW50KSB7XG4gICAgICAgIGlmICh0aGlzLnRyZWUuZHJvcHBhYmxlTm9kZXMgJiYgdGhpcy5ub2RlLmRyb3BwYWJsZSAhPT0gZmFsc2UpIHtcbiAgICAgICAgICAgIGxldCBkcmFnTm9kZSA9IHRoaXMudHJlZS5kcmFnTm9kZTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYodGhpcy50cmVlLmFsbG93RHJvcChkcmFnTm9kZSwgdGhpcy5ub2RlLCB0aGlzLnRyZWUuZHJhZ05vZGVTY29wZSwgRHJvcFR5cGUuTm9kZSkpIHtcbiAgICAgICAgICAgICAgICAvLyBsZXQgZHJhZ05vZGVJbmRleCA9IHRoaXMudHJlZS5kcmFnTm9kZUluZGV4O1xuICAgICAgICAgICAgICAgIC8vIGNvbnN0IHJlc29sdmUgPSBuZXcgU3ViamVjdDxib29sZWFuPigpO1xuXG4gICAgICAgICAgICAgICAgLy8gcmVzb2x2ZS5waXBlKGZpcnN0KCkpLnN1YnNjcmliZShwcm9jZWVkID0+IHtcbiAgICAgICAgICAgICAgICAvLyAgICAgaWYgKHByb2NlZWQgIT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgLy8gICAgICAgICB0aGlzLnRyZWUuZHJhZ05vZGVTdWJOb2Rlcy5zcGxpY2UoZHJhZ05vZGVJbmRleCwgMSk7XG5cbiAgICAgICAgICAgICAgICAvLyAgICAgICAgIGlmICh0aGlzLm5vZGUuY2hpbGRyZW4pXG4gICAgICAgICAgICAgICAgLy8gICAgICAgICAgICAgdGhpcy5ub2RlLmNoaWxkcmVuLnB1c2goZHJhZ05vZGUpO1xuICAgICAgICAgICAgICAgIC8vICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIC8vICAgICAgICAgICAgIHRoaXMubm9kZS5jaGlsZHJlbiA9IFtkcmFnTm9kZV07XG4gICAgICAgICAgICAgICAgLy8gICAgIH1cblxuICAgICAgICAgICAgICAgIC8vICAgICB0aGlzLnRyZWUuZHJhZ0Ryb3BTZXJ2aWNlLnN0b3BEcmFnKHtcbiAgICAgICAgICAgICAgICAvLyAgICAgICAgIG5vZGU6IGRyYWdOb2RlLFxuICAgICAgICAgICAgICAgIC8vICAgICAgICAgc3ViTm9kZXM6IHRoaXMubm9kZS5wYXJlbnQgPyB0aGlzLm5vZGUucGFyZW50LmNoaWxkcmVuIDogdGhpcy50cmVlLnZhbHVlLFxuICAgICAgICAgICAgICAgIC8vICAgICAgICAgaW5kZXg6IHRoaXMudHJlZS5kcmFnTm9kZUluZGV4XG4gICAgICAgICAgICAgICAgLy8gICAgIH0pO1xuICAgICAgICAgICAgICAgIC8vIH0pO1xuXG4gICAgICAgICAgICAgICAgLy8gdGhpcy50cmVlLm9uTm9kZURyb3AuZW1pdCh7XG4gICAgICAgICAgICAgICAgLy8gICAgIG9yaWdpbmFsRXZlbnQ6IGV2ZW50LFxuICAgICAgICAgICAgICAgIC8vICAgICBkcmFnTm9kZTogZHJhZ05vZGUsXG4gICAgICAgICAgICAgICAgLy8gICAgIGRyb3BOb2RlOiB0aGlzLm5vZGUsXG4gICAgICAgICAgICAgICAgLy8gICAgIGluZGV4OiB0aGlzLmluZGV4LFxuICAgICAgICAgICAgICAgIC8vICAgICBwcm9jZWVkOiByZXNvbHZlXG4gICAgICAgICAgICAgICAgLy8gfSk7XG5cbiAgICAgICAgICAgICAgICBsZXQgZHJvcFBhcmFtcyA9IHsuLi50aGlzLmNyZWF0ZURyb3BOb2RlRXZlbnRNZXRhZGF0YSgpfTtcblxuICAgICAgICAgICAgICAgIGlmICh0aGlzLnRyZWUudmFsaWRhdGVEcm9wKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudHJlZS5vbk5vZGVEcm9wLmVtaXQoe1xuICAgICAgICAgICAgICAgICAgICAgICAgb3JpZ2luYWxFdmVudDogZXZlbnQsXG4gICAgICAgICAgICAgICAgICAgICAgICBkcmFnTm9kZTogZHJhZ05vZGUsXG4gICAgICAgICAgICAgICAgICAgICAgICBkcm9wTm9kZTogdGhpcy5ub2RlLFxuICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXg6IHRoaXMuaW5kZXgsXG4gICAgICAgICAgICAgICAgICAgICAgICBhY2NlcHQ6ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnByb2Nlc3NOb2RlRHJvcChkcm9wUGFyYW1zKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnByb2Nlc3NOb2RlRHJvcChkcm9wUGFyYW1zKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50cmVlLm9uTm9kZURyb3AuZW1pdCh7XG4gICAgICAgICAgICAgICAgICAgICAgICBvcmlnaW5hbEV2ZW50OiBldmVudCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRyYWdOb2RlOiBkcmFnTm9kZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRyb3BOb2RlOiB0aGlzLm5vZGUsXG4gICAgICAgICAgICAgICAgICAgICAgICBpbmRleDogdGhpcy5pbmRleFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgdGhpcy5kcmFnaG92ZXJOb2RlID0gZmFsc2U7XG4gICAgfVxuXG4gICAgY3JlYXRlRHJvcE5vZGVFdmVudE1ldGFkYXRhKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZHJhZ05vZGU6IHRoaXMudHJlZS5kcmFnTm9kZSxcbiAgICAgICAgICAgIGRyYWdOb2RlSW5kZXg6ICB0aGlzLnRyZWUuZHJhZ05vZGVJbmRleCxcbiAgICAgICAgICAgIGRyYWdOb2RlU3ViTm9kZXM6IHRoaXMudHJlZS5kcmFnTm9kZVN1Yk5vZGVzLFxuICAgICAgICAgICAgZHJvcE5vZGU6IHRoaXMubm9kZVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIHByb2Nlc3NOb2RlRHJvcChldmVudCkge1xuICAgICAgICBsZXQgZHJhZ05vZGVJbmRleCA9IGV2ZW50LmRyYWdOb2RlSW5kZXg7XG4gICAgICAgIGV2ZW50LmRyYWdOb2RlU3ViTm9kZXMuc3BsaWNlKGRyYWdOb2RlSW5kZXgsIDEpO1xuXG4gICAgICAgIGlmIChldmVudC5kcm9wTm9kZS5jaGlsZHJlbilcbiAgICAgICAgICAgIGV2ZW50LmRyb3BOb2RlLmNoaWxkcmVuLnB1c2goZXZlbnQuZHJhZ05vZGUpO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBldmVudC5kcm9wTm9kZS5jaGlsZHJlbiA9IFtldmVudC5kcmFnTm9kZV07XG5cbiAgICAgICAgdGhpcy50cmVlLmRyYWdEcm9wU2VydmljZS5zdG9wRHJhZyh7XG4gICAgICAgICAgICBub2RlOiBldmVudC5kcmFnTm9kZSxcbiAgICAgICAgICAgIHN1Yk5vZGVzOiBldmVudC5kcm9wTm9kZS5wYXJlbnQgPyBldmVudC5kcm9wTm9kZS5wYXJlbnQuY2hpbGRyZW4gOiB0aGlzLnRyZWUudmFsdWUsXG4gICAgICAgICAgICBpbmRleDogZHJhZ05vZGVJbmRleFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBvbkRyb3BOb2RlRHJhZ0VudGVyKGV2ZW50KSB7XG4gICAgICAgIGlmKHRoaXMudHJlZS5kcm9wcGFibGVOb2RlcyAmJiB0aGlzLm5vZGUuZHJvcHBhYmxlICE9PSBmYWxzZSAmJiB0aGlzLnRyZWUuYWxsb3dEcm9wKHRoaXMudHJlZS5kcmFnTm9kZSwgdGhpcy5ub2RlLCB0aGlzLnRyZWUuZHJhZ05vZGVTY29wZSwgRHJvcFR5cGUuTm9kZSkpIHtcbiAgICAgICAgICAgIHRoaXMuZHJhZ2hvdmVyTm9kZSA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBvbkRyb3BOb2RlRHJhZ0xlYXZlKGV2ZW50KSB7XG4gICAgICAgIGlmICh0aGlzLnRyZWUuZHJvcHBhYmxlTm9kZXMpIHtcbiAgICAgICAgICAgIGxldCByZWN0ID0gZXZlbnQuY3VycmVudFRhcmdldC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgICAgIGlmIChldmVudC54ID4gcmVjdC5sZWZ0ICsgcmVjdC53aWR0aCB8fCBldmVudC54IDwgcmVjdC5sZWZ0IHx8IGV2ZW50LnkgPj0gTWF0aC5mbG9vcihyZWN0LnRvcCArIHJlY3QuaGVpZ2h0KSB8fCBldmVudC55IDwgcmVjdC50b3ApIHtcbiAgICAgICAgICAgICAgIHRoaXMuZHJhZ2hvdmVyTm9kZSA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgb25LZXlEb3duKGV2ZW50OiBLZXlib2FyZEV2ZW50KSB7XG4gICAgICAgIGNvbnN0IG5vZGVFbGVtZW50ID0gKDxIVE1MRGl2RWxlbWVudD4gZXZlbnQudGFyZ2V0KS5wYXJlbnRFbGVtZW50LnBhcmVudEVsZW1lbnQ7XG5cbiAgICAgICAgaWYgKG5vZGVFbGVtZW50Lm5vZGVOYW1lICE9PSAnUC1UUkVFTk9ERScpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHN3aXRjaCAoZXZlbnQud2hpY2gpIHtcbiAgICAgICAgICAgIC8vZG93biBhcnJvd1xuICAgICAgICAgICAgY2FzZSA0MDpcbiAgICAgICAgICAgICAgICBjb25zdCBsaXN0RWxlbWVudCA9ICh0aGlzLnRyZWUuZHJvcHBhYmxlTm9kZXMpID8gbm9kZUVsZW1lbnQuY2hpbGRyZW5bMV0uY2hpbGRyZW5bMV0gOiBub2RlRWxlbWVudC5jaGlsZHJlblswXS5jaGlsZHJlblsxXTtcbiAgICAgICAgICAgICAgICBpZiAobGlzdEVsZW1lbnQgJiYgbGlzdEVsZW1lbnQuY2hpbGRyZW4ubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmZvY3VzTm9kZShsaXN0RWxlbWVudC5jaGlsZHJlblswXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBuZXh0Tm9kZUVsZW1lbnQgPSBub2RlRWxlbWVudC5uZXh0RWxlbWVudFNpYmxpbmc7XG4gICAgICAgICAgICAgICAgICAgIGlmIChuZXh0Tm9kZUVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZm9jdXNOb2RlKG5leHROb2RlRWxlbWVudCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgbmV4dFNpYmxpbmdBbmNlc3RvciA9IHRoaXMuZmluZE5leHRTaWJsaW5nT2ZBbmNlc3Rvcihub2RlRWxlbWVudCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobmV4dFNpYmxpbmdBbmNlc3Rvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZm9jdXNOb2RlKG5leHRTaWJsaW5nQW5jZXN0b3IpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAvL3VwIGFycm93XG4gICAgICAgICAgICBjYXNlIDM4OlxuICAgICAgICAgICAgICAgIGlmIChub2RlRWxlbWVudC5wcmV2aW91c0VsZW1lbnRTaWJsaW5nKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZm9jdXNOb2RlKHRoaXMuZmluZExhc3RWaXNpYmxlRGVzY2VuZGFudChub2RlRWxlbWVudC5wcmV2aW91c0VsZW1lbnRTaWJsaW5nKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBsZXQgcGFyZW50Tm9kZUVsZW1lbnQgPSB0aGlzLmdldFBhcmVudE5vZGVFbGVtZW50KG5vZGVFbGVtZW50KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHBhcmVudE5vZGVFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmZvY3VzTm9kZShwYXJlbnROb2RlRWxlbWVudCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIC8vcmlnaHQgYXJyb3dcbiAgICAgICAgICAgIGNhc2UgMzk6XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLm5vZGUuZXhwYW5kZWQgJiYgIXRoaXMudHJlZS5pc05vZGVMZWFmKHRoaXMubm9kZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5leHBhbmQoZXZlbnQpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgLy9sZWZ0IGFycm93XG4gICAgICAgICAgICBjYXNlIDM3OlxuICAgICAgICAgICAgICAgIGlmICh0aGlzLm5vZGUuZXhwYW5kZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jb2xsYXBzZShldmVudCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBsZXQgcGFyZW50Tm9kZUVsZW1lbnQgPSB0aGlzLmdldFBhcmVudE5vZGVFbGVtZW50KG5vZGVFbGVtZW50KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHBhcmVudE5vZGVFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmZvY3VzTm9kZShwYXJlbnROb2RlRWxlbWVudCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIC8vZW50ZXJcbiAgICAgICAgICAgIGNhc2UgMTM6XG4gICAgICAgICAgICAgICAgdGhpcy50cmVlLm9uTm9kZUNsaWNrKGV2ZW50LCB0aGlzLm5vZGUpO1xuICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAvL25vIG9wXG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZpbmROZXh0U2libGluZ09mQW5jZXN0b3Iobm9kZUVsZW1lbnQpIHtcbiAgICAgICAgbGV0IHBhcmVudE5vZGVFbGVtZW50ID0gdGhpcy5nZXRQYXJlbnROb2RlRWxlbWVudChub2RlRWxlbWVudCk7XG4gICAgICAgIGlmIChwYXJlbnROb2RlRWxlbWVudCkge1xuICAgICAgICAgICAgaWYgKHBhcmVudE5vZGVFbGVtZW50Lm5leHRFbGVtZW50U2libGluZylcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Tm9kZUVsZW1lbnQubmV4dEVsZW1lbnRTaWJsaW5nO1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmZpbmROZXh0U2libGluZ09mQW5jZXN0b3IocGFyZW50Tm9kZUVsZW1lbnQpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmaW5kTGFzdFZpc2libGVEZXNjZW5kYW50KG5vZGVFbGVtZW50KSB7XG4gICAgICAgIGNvbnN0IGxpc3RFbGVtZW50ID0gPEhUTUxFbGVtZW50PiBBcnJheS5mcm9tKG5vZGVFbGVtZW50LmNoaWxkcmVuKS5maW5kKGVsID0+IERvbUhhbmRsZXIuaGFzQ2xhc3MoZWwsICdwLXRyZWVub2RlJykpO1xuICAgICAgICBjb25zdCBjaGlsZHJlbkxpc3RFbGVtZW50ID0gbGlzdEVsZW1lbnQuY2hpbGRyZW5bMV07XG4gICAgICAgIGlmIChjaGlsZHJlbkxpc3RFbGVtZW50ICYmIGNoaWxkcmVuTGlzdEVsZW1lbnQuY2hpbGRyZW4ubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgY29uc3QgbGFzdENoaWxkRWxlbWVudCA9IGNoaWxkcmVuTGlzdEVsZW1lbnQuY2hpbGRyZW5bY2hpbGRyZW5MaXN0RWxlbWVudC5jaGlsZHJlbi5sZW5ndGggLSAxXTtcblxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZmluZExhc3RWaXNpYmxlRGVzY2VuZGFudChsYXN0Q2hpbGRFbGVtZW50KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBub2RlRWxlbWVudDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGdldFBhcmVudE5vZGVFbGVtZW50KG5vZGVFbGVtZW50KSB7XG4gICAgICAgIGNvbnN0IHBhcmVudE5vZGVFbGVtZW50ID0gbm9kZUVsZW1lbnQucGFyZW50RWxlbWVudC5wYXJlbnRFbGVtZW50LnBhcmVudEVsZW1lbnQ7XG5cbiAgICAgICAgcmV0dXJuIHBhcmVudE5vZGVFbGVtZW50LnRhZ05hbWUgPT09ICdQLVRSRUVOT0RFJyA/IHBhcmVudE5vZGVFbGVtZW50IDogbnVsbDtcbiAgICB9XG5cbiAgICBmb2N1c05vZGUoZWxlbWVudCkge1xuICAgICAgICBpZiAodGhpcy50cmVlLmRyb3BwYWJsZU5vZGVzKVxuICAgICAgICAgICAgZWxlbWVudC5jaGlsZHJlblsxXS5jaGlsZHJlblswXS5mb2N1cygpO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBlbGVtZW50LmNoaWxkcmVuWzBdLmNoaWxkcmVuWzBdLmZvY3VzKCk7XG4gICAgfVxufVxuXG5AQ29tcG9uZW50KHtcbiAgICBzZWxlY3RvcjogJ3AtdHJlZScsXG4gICAgdGVtcGxhdGU6IGBcbiAgICAgICAgPGRpdiBbbmdDbGFzc109XCJ7J3AtdHJlZSBwLWNvbXBvbmVudCc6dHJ1ZSwncC10cmVlLXNlbGVjdGFibGUnOnNlbGVjdGlvbk1vZGUsXG4gICAgICAgICAgICAgICAgJ3AtdHJlZW5vZGUtZHJhZ292ZXInOmRyYWdIb3ZlciwncC10cmVlLWxvYWRpbmcnOiBsb2FkaW5nLCAncC10cmVlLWZsZXgtc2Nyb2xsYWJsZSc6IHNjcm9sbEhlaWdodCA9PT0gJ2ZsZXgnfVwiIFxuICAgICAgICAgICAgW25nU3R5bGVdPVwic3R5bGVcIiBbY2xhc3NdPVwic3R5bGVDbGFzc1wiICpuZ0lmPVwiIWhvcml6b250YWxcIlxuICAgICAgICAgICAgKGRyb3ApPVwib25Ecm9wKCRldmVudClcIiAoZHJhZ292ZXIpPVwib25EcmFnT3ZlcigkZXZlbnQpXCIgKGRyYWdlbnRlcik9XCJvbkRyYWdFbnRlcigkZXZlbnQpXCIgKGRyYWdsZWF2ZSk9XCJvbkRyYWdMZWF2ZSgkZXZlbnQpXCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwicC10cmVlLWxvYWRpbmctb3ZlcmxheSBwLWNvbXBvbmVudC1vdmVybGF5XCIgKm5nSWY9XCJsb2FkaW5nXCI+XG4gICAgICAgICAgICAgICAgPGkgW2NsYXNzXT1cIidwLXRyZWUtbG9hZGluZy1pY29uIHBpLXNwaW4gJyArIGxvYWRpbmdJY29uXCI+PC9pPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8ZGl2ICpuZ0lmPVwiZmlsdGVyXCIgY2xhc3M9XCJwLXRyZWUtZmlsdGVyLWNvbnRhaW5lclwiPlxuICAgICAgICAgICAgICAgIDxpbnB1dCAjZmlsdGVyIHR5cGU9XCJ0ZXh0XCIgYXV0b2NvbXBsZXRlPVwib2ZmXCIgY2xhc3M9XCJwLXRyZWUtZmlsdGVyIHAtaW5wdXR0ZXh0IHAtY29tcG9uZW50XCIgW2F0dHIucGxhY2Vob2xkZXJdPVwiZmlsdGVyUGxhY2Vob2xkZXJcIlxuICAgICAgICAgICAgICAgICAgICAoa2V5ZG93bi5lbnRlcik9XCIkZXZlbnQucHJldmVudERlZmF1bHQoKVwiIChpbnB1dCk9XCJfZmlsdGVyKCRldmVudClcIj5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJwLXRyZWUtZmlsdGVyLWljb24gcGkgcGktc2VhcmNoXCI+PC9zcGFuPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8bmctY29udGFpbmVyICpuZ0lmPVwiIXZpcnR1YWxTY3JvbGw7IGVsc2UgdmlydHVhbFNjcm9sbExpc3RcIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwicC10cmVlLXdyYXBwZXJcIiBbc3R5bGUubWF4LWhlaWdodF09XCJzY3JvbGxIZWlnaHRcIj5cbiAgICAgICAgICAgICAgICAgICAgPHVsIGNsYXNzPVwicC10cmVlLWNvbnRhaW5lclwiICpuZ0lmPVwiZ2V0Um9vdE5vZGUoKVwiIHJvbGU9XCJ0cmVlXCIgW2F0dHIuYXJpYS1sYWJlbF09XCJhcmlhTGFiZWxcIiBbYXR0ci5hcmlhLWxhYmVsbGVkYnldPVwiYXJpYUxhYmVsbGVkQnlcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxwLXRyZWVOb2RlICpuZ0Zvcj1cImxldCBub2RlIG9mIGdldFJvb3ROb2RlKCk7IGxldCBmaXJzdENoaWxkPWZpcnN0O2xldCBsYXN0Q2hpbGQ9bGFzdDsgbGV0IGluZGV4PWluZGV4OyB0cmFja0J5OiB0cmFja0J5XCIgW25vZGVdPVwibm9kZVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBbZmlyc3RDaGlsZF09XCJmaXJzdENoaWxkXCIgW2xhc3RDaGlsZF09XCJsYXN0Q2hpbGRcIiBbaW5kZXhdPVwiaW5kZXhcIiBbbGV2ZWxdPVwiMFwiPjwvcC10cmVlTm9kZT5cbiAgICAgICAgICAgICAgICAgICAgPC91bD5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvbmctY29udGFpbmVyPlxuICAgICAgICAgICAgPG5nLXRlbXBsYXRlICN2aXJ0dWFsU2Nyb2xsTGlzdD5cbiAgICAgICAgICAgICAgICA8Y2RrLXZpcnR1YWwtc2Nyb2xsLXZpZXdwb3J0IGNsYXNzPVwicC10cmVlLXdyYXBwZXJcIiBbc3R5bGUuaGVpZ2h0XT1cInNjcm9sbEhlaWdodFwiIFtpdGVtU2l6ZV09XCJ2aXJ0dWFsTm9kZUhlaWdodFwiIFttaW5CdWZmZXJQeF09XCJtaW5CdWZmZXJQeFwiIFttYXhCdWZmZXJQeF09XCJtYXhCdWZmZXJQeFwiPlxuICAgICAgICAgICAgICAgICAgICA8dWwgY2xhc3M9XCJwLXRyZWUtY29udGFpbmVyXCIgKm5nSWY9XCJnZXRSb290Tm9kZSgpXCIgcm9sZT1cInRyZWVcIiBbYXR0ci5hcmlhLWxhYmVsXT1cImFyaWFMYWJlbFwiIFthdHRyLmFyaWEtbGFiZWxsZWRieV09XCJhcmlhTGFiZWxsZWRCeVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHAtdHJlZU5vZGUgKmNka1ZpcnR1YWxGb3I9XCJsZXQgcm93Tm9kZSBvZiBzZXJpYWxpemVkVmFsdWU7IGxldCBmaXJzdENoaWxkPWZpcnN0OyBsZXQgbGFzdENoaWxkPWxhc3Q7IGxldCBpbmRleD1pbmRleDsgdHJhY2tCeTogdHJhY2tCeTsgdGVtcGxhdGVDYWNoZVNpemU6IDBcIiAgW2xldmVsXT1cInJvd05vZGUubGV2ZWxcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgW3Jvd05vZGVdPVwicm93Tm9kZVwiIFtub2RlXT1cInJvd05vZGUubm9kZVwiIFtmaXJzdENoaWxkXT1cImZpcnN0Q2hpbGRcIiBbbGFzdENoaWxkXT1cImxhc3RDaGlsZFwiIFtpbmRleF09XCJpbmRleFwiIFtzdHlsZS5oZWlnaHQucHhdPVwidmlydHVhbE5vZGVIZWlnaHRcIj48L3AtdHJlZU5vZGU+XG4gICAgICAgICAgICAgICAgICAgIDwvdWw+XG4gICAgICAgICAgICAgICAgPC9jZGstdmlydHVhbC1zY3JvbGwtdmlld3BvcnQ+XG4gICAgICAgICAgICA8L25nLXRlbXBsYXRlPlxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cInAtdHJlZS1lbXB0eS1tZXNzYWdlXCIgKm5nSWY9XCIhbG9hZGluZyAmJiAodmFsdWUgPT0gbnVsbCB8fCB2YWx1ZS5sZW5ndGggPT09IDApXCI+e3tlbXB0eU1lc3NhZ2V9fTwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBbbmdDbGFzc109XCJ7J3AtdHJlZSBwLXRyZWUtaG9yaXpvbnRhbCBwLWNvbXBvbmVudCc6dHJ1ZSwncC10cmVlLXNlbGVjdGFibGUnOnNlbGVjdGlvbk1vZGV9XCIgIFtuZ1N0eWxlXT1cInN0eWxlXCIgW2NsYXNzXT1cInN0eWxlQ2xhc3NcIiAqbmdJZj1cImhvcml6b250YWxcIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJwLXRyZWUtbG9hZGluZy1tYXNrIHAtY29tcG9uZW50LW92ZXJsYXlcIiAqbmdJZj1cImxvYWRpbmdcIj5cbiAgICAgICAgICAgICAgICA8aSBbY2xhc3NdPVwiJ3AtdHJlZS1sb2FkaW5nLWljb24gcGktc3BpbiAnICsgbG9hZGluZ0ljb25cIj48L2k+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDx0YWJsZSAqbmdJZj1cInZhbHVlJiZ2YWx1ZVswXVwiPlxuICAgICAgICAgICAgICAgIDxwLXRyZWVOb2RlIFtub2RlXT1cInZhbHVlWzBdXCIgW3Jvb3RdPVwidHJ1ZVwiPjwvcC10cmVlTm9kZT5cbiAgICAgICAgICAgIDwvdGFibGU+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwicC10cmVlLWVtcHR5LW1lc3NhZ2VcIiAqbmdJZj1cIiFsb2FkaW5nICYmICh2YWx1ZSA9PSBudWxsIHx8IHZhbHVlLmxlbmd0aCA9PT0gMClcIj57e2VtcHR5TWVzc2FnZX19PC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgIGAsXG4gICAgY2hhbmdlRGV0ZWN0aW9uOiBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneS5EZWZhdWx0LFxuICAgIGVuY2Fwc3VsYXRpb246IFZpZXdFbmNhcHN1bGF0aW9uLk5vbmUsXG4gICAgc3R5bGVVcmxzOiBbJy4vdHJlZS5jc3MnXVxufSlcbmV4cG9ydCBjbGFzcyBUcmVlIGltcGxlbWVudHMgT25Jbml0LEFmdGVyQ29udGVudEluaXQsT25DaGFuZ2VzLE9uRGVzdHJveSxCbG9ja2FibGVVSSB7XG5cbiAgICBASW5wdXQoKSB2YWx1ZTogVHJlZU5vZGVbXTtcblxuICAgIEBJbnB1dCgpIHNlbGVjdGlvbk1vZGU6IHN0cmluZztcblxuICAgIEBJbnB1dCgpIHNlbGVjdGlvbjogYW55O1xuXG4gICAgQE91dHB1dCgpIHNlbGVjdGlvbkNoYW5nZTogRXZlbnRFbWl0dGVyPGFueT4gPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG5cbiAgICBAT3V0cHV0KCkgb25Ob2RlU2VsZWN0OiBFdmVudEVtaXR0ZXI8YW55PiA9IG5ldyBFdmVudEVtaXR0ZXIoKTtcblxuICAgIEBPdXRwdXQoKSBvbk5vZGVVbnNlbGVjdDogRXZlbnRFbWl0dGVyPGFueT4gPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG5cbiAgICBAT3V0cHV0KCkgb25Ob2RlRXhwYW5kOiBFdmVudEVtaXR0ZXI8YW55PiA9IG5ldyBFdmVudEVtaXR0ZXIoKTtcblxuICAgIEBPdXRwdXQoKSBvbk5vZGVDb2xsYXBzZTogRXZlbnRFbWl0dGVyPGFueT4gPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG5cbiAgICBAT3V0cHV0KCkgb25Ob2RlQ29udGV4dE1lbnVTZWxlY3Q6IEV2ZW50RW1pdHRlcjxhbnk+ID0gbmV3IEV2ZW50RW1pdHRlcigpO1xuXG4gICAgQE91dHB1dCgpIG9uTm9kZURyb3A6IEV2ZW50RW1pdHRlcjxhbnk+ID0gbmV3IEV2ZW50RW1pdHRlcigpO1xuXG4gICAgQElucHV0KCkgc3R5bGU6IGFueTtcblxuICAgIEBJbnB1dCgpIHN0eWxlQ2xhc3M6IHN0cmluZztcblxuICAgIEBJbnB1dCgpIGNvbnRleHRNZW51OiBhbnk7XG5cbiAgICBASW5wdXQoKSBsYXlvdXQ6IHN0cmluZyA9ICd2ZXJ0aWNhbCc7XG5cbiAgICBASW5wdXQoKSBkcmFnZ2FibGVTY29wZTogYW55O1xuXG4gICAgQElucHV0KCkgZHJvcHBhYmxlU2NvcGU6IGFueTtcblxuICAgIEBJbnB1dCgpIGRyYWdnYWJsZU5vZGVzOiBib29sZWFuO1xuXG4gICAgQElucHV0KCkgZHJvcHBhYmxlTm9kZXM6IGJvb2xlYW47XG5cbiAgICBASW5wdXQoKSBtZXRhS2V5U2VsZWN0aW9uOiBib29sZWFuID0gdHJ1ZTtcblxuICAgIEBJbnB1dCgpIHByb3BhZ2F0ZVNlbGVjdGlvblVwOiBib29sZWFuID0gdHJ1ZTtcblxuICAgIEBJbnB1dCgpIHByb3BhZ2F0ZVNlbGVjdGlvbkRvd246IGJvb2xlYW4gPSB0cnVlO1xuXG4gICAgQElucHV0KCkgbG9hZGluZzogYm9vbGVhbjtcblxuICAgIEBJbnB1dCgpIGxvYWRpbmdJY29uOiBzdHJpbmcgPSAncGkgcGktc3Bpbm5lcic7XG5cbiAgICBASW5wdXQoKSBlbXB0eU1lc3NhZ2U6IHN0cmluZyA9ICdObyByZWNvcmRzIGZvdW5kJztcblxuICAgIEBJbnB1dCgpIGFyaWFMYWJlbDogc3RyaW5nO1xuXG4gICAgQElucHV0KCkgYXJpYUxhYmVsbGVkQnk6IHN0cmluZztcblxuICAgIEBJbnB1dCgpIHZhbGlkYXRlRHJvcDogYm9vbGVhbjtcblxuICAgIEBJbnB1dCgpIGZpbHRlcjogYm9vbGVhbjtcblxuICAgIEBJbnB1dCgpIGZpbHRlckJ5OiBzdHJpbmcgPSAnbGFiZWwnO1xuXG4gICAgQElucHV0KCkgZmlsdGVyTW9kZTogc3RyaW5nID0gJ2xlbmllbnQnO1xuXG4gICAgQElucHV0KCkgZmlsdGVyUGxhY2Vob2xkZXI6IHN0cmluZztcblxuICAgIEBJbnB1dCgpIGZpbHRlckxvY2FsZTogc3RyaW5nO1xuXG4gICAgQElucHV0KCkgc2Nyb2xsSGVpZ2h0OiBzdHJpbmc7XG5cbiAgICBASW5wdXQoKSB2aXJ0dWFsU2Nyb2xsOiBib29sZWFuO1xuXG4gICAgQElucHV0KCkgdmlydHVhbE5vZGVIZWlnaHQ6IHN0cmluZztcblxuICAgIEBJbnB1dCgpIG1pbkJ1ZmZlclB4OiBudW1iZXI7XG5cbiAgICBASW5wdXQoKSBtYXhCdWZmZXJQeDogbnVtYmVyO1xuXG4gICAgQElucHV0KCkgdHJhY2tCeTogRnVuY3Rpb24gPSAoaW5kZXg6IG51bWJlciwgaXRlbTogYW55KSA9PiBpdGVtO1xuXG4gICAgQE91dHB1dCgpIG9uRmlsdGVyOiBFdmVudEVtaXR0ZXI8YW55PiA9IG5ldyBFdmVudEVtaXR0ZXIoKTtcblxuICAgIEBDb250ZW50Q2hpbGRyZW4oUHJpbWVUZW1wbGF0ZSkgdGVtcGxhdGVzOiBRdWVyeUxpc3Q8YW55PjtcblxuICAgIHNlcmlhbGl6ZWRWYWx1ZTogYW55W107XG5cbiAgICBwdWJsaWMgdGVtcGxhdGVNYXA6IGFueTtcblxuICAgIHB1YmxpYyBub2RlVG91Y2hlZDogYm9vbGVhbjtcblxuICAgIHB1YmxpYyBkcmFnTm9kZVRyZWU6IFRyZWU7XG5cbiAgICBwdWJsaWMgZHJhZ05vZGU6IFRyZWVOb2RlO1xuXG4gICAgcHVibGljIGRyYWdOb2RlU3ViTm9kZXM6IFRyZWVOb2RlW107XG5cbiAgICBwdWJsaWMgZHJhZ05vZGVJbmRleDogbnVtYmVyO1xuXG4gICAgcHVibGljIGRyYWdOb2RlU2NvcGU6IGFueTtcblxuICAgIHB1YmxpYyBkcmFnSG92ZXI6IGJvb2xlYW47XG5cbiAgICBwdWJsaWMgZHJhZ1N0YXJ0U3Vic2NyaXB0aW9uOiBTdWJzY3JpcHRpb247XG5cbiAgICBwdWJsaWMgZHJhZ1N0b3BTdWJzY3JpcHRpb246IFN1YnNjcmlwdGlvbjtcblxuICAgIHB1YmxpYyBmaWx0ZXJlZE5vZGVzOiBUcmVlTm9kZVtdO1xuXG4gICAgY29uc3RydWN0b3IocHVibGljIGVsOiBFbGVtZW50UmVmLCBAT3B0aW9uYWwoKSBwdWJsaWMgZHJhZ0Ryb3BTZXJ2aWNlOiBUcmVlRHJhZ0Ryb3BTZXJ2aWNlKSB7fVxuXG4gICAgbmdPbkluaXQoKSB7XG4gICAgICAgIGlmICh0aGlzLmRyb3BwYWJsZU5vZGVzKSB7XG4gICAgICAgICAgICB0aGlzLmRyYWdTdGFydFN1YnNjcmlwdGlvbiA9IHRoaXMuZHJhZ0Ryb3BTZXJ2aWNlLmRyYWdTdGFydCQuc3Vic2NyaWJlKFxuICAgICAgICAgICAgICBldmVudCA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5kcmFnTm9kZVRyZWUgPSBldmVudC50cmVlO1xuICAgICAgICAgICAgICAgIHRoaXMuZHJhZ05vZGUgPSBldmVudC5ub2RlO1xuICAgICAgICAgICAgICAgIHRoaXMuZHJhZ05vZGVTdWJOb2RlcyA9IGV2ZW50LnN1Yk5vZGVzO1xuICAgICAgICAgICAgICAgIHRoaXMuZHJhZ05vZGVJbmRleCA9IGV2ZW50LmluZGV4O1xuICAgICAgICAgICAgICAgIHRoaXMuZHJhZ05vZGVTY29wZSA9IGV2ZW50LnNjb3BlO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHRoaXMuZHJhZ1N0b3BTdWJzY3JpcHRpb24gPSB0aGlzLmRyYWdEcm9wU2VydmljZS5kcmFnU3RvcCQuc3Vic2NyaWJlKFxuICAgICAgICAgICAgICBldmVudCA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5kcmFnTm9kZVRyZWUgPSBudWxsO1xuICAgICAgICAgICAgICAgIHRoaXMuZHJhZ05vZGUgPSBudWxsO1xuICAgICAgICAgICAgICAgIHRoaXMuZHJhZ05vZGVTdWJOb2RlcyA9IG51bGw7XG4gICAgICAgICAgICAgICAgdGhpcy5kcmFnTm9kZUluZGV4ID0gbnVsbDtcbiAgICAgICAgICAgICAgICB0aGlzLmRyYWdOb2RlU2NvcGUgPSBudWxsO1xuICAgICAgICAgICAgICAgIHRoaXMuZHJhZ0hvdmVyID0gZmFsc2U7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIG5nT25DaGFuZ2VzKHNpbXBsZUNoYW5nZTogU2ltcGxlQ2hhbmdlcykge1xuICAgICAgICBpZiAoc2ltcGxlQ2hhbmdlLnZhbHVlKSB7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVNlcmlhbGl6ZWRWYWx1ZSgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZ2V0IGhvcml6b250YWwoKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiB0aGlzLmxheW91dCA9PSAnaG9yaXpvbnRhbCc7XG4gICAgfVxuXG4gICAgbmdBZnRlckNvbnRlbnRJbml0KCkge1xuICAgICAgICBpZiAodGhpcy50ZW1wbGF0ZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICB0aGlzLnRlbXBsYXRlTWFwID0ge307XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnRlbXBsYXRlcy5mb3JFYWNoKChpdGVtKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnRlbXBsYXRlTWFwW2l0ZW0ubmFtZV0gPSBpdGVtLnRlbXBsYXRlO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICB1cGRhdGVTZXJpYWxpemVkVmFsdWUoKSB7XG4gICAgICAgIHRoaXMuc2VyaWFsaXplZFZhbHVlID0gW107XG4gICAgICAgIHRoaXMuc2VyaWFsaXplTm9kZXMobnVsbCwgdGhpcy5nZXRSb290Tm9kZSgpLCAwLCB0cnVlKTtcbiAgICB9XG5cbiAgICBzZXJpYWxpemVOb2RlcyhwYXJlbnQsIG5vZGVzLCBsZXZlbCwgdmlzaWJsZSkge1xuICAgICAgICBpZiAobm9kZXMgJiYgbm9kZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICBmb3IobGV0IG5vZGUgb2Ygbm9kZXMpIHtcbiAgICAgICAgICAgICAgICBub2RlLnBhcmVudCA9IHBhcmVudDtcbiAgICAgICAgICAgICAgICBjb25zdCByb3dOb2RlID0ge1xuICAgICAgICAgICAgICAgICAgICBub2RlOiBub2RlLFxuICAgICAgICAgICAgICAgICAgICBwYXJlbnQ6IHBhcmVudCxcbiAgICAgICAgICAgICAgICAgICAgbGV2ZWw6IGxldmVsLFxuICAgICAgICAgICAgICAgICAgICB2aXNpYmxlOiB2aXNpYmxlICYmIChwYXJlbnQgPyBwYXJlbnQuZXhwYW5kZWQgOiB0cnVlKVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgdGhpcy5zZXJpYWxpemVkVmFsdWUucHVzaChyb3dOb2RlKTtcblxuICAgICAgICAgICAgICAgIGlmIChyb3dOb2RlLnZpc2libGUgJiYgbm9kZS5leHBhbmRlZCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNlcmlhbGl6ZU5vZGVzKG5vZGUsIG5vZGUuY2hpbGRyZW4sIGxldmVsICsgMSwgcm93Tm9kZS52aXNpYmxlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBvbk5vZGVDbGljayhldmVudCwgbm9kZTogVHJlZU5vZGUpIHtcbiAgICAgICAgbGV0IGV2ZW50VGFyZ2V0ID0gKDxFbGVtZW50PiBldmVudC50YXJnZXQpO1xuXG4gICAgICAgIGlmIChEb21IYW5kbGVyLmhhc0NsYXNzKGV2ZW50VGFyZ2V0LCAncC10cmVlLXRvZ2dsZXInKSB8fCBEb21IYW5kbGVyLmhhc0NsYXNzKGV2ZW50VGFyZ2V0LCAncC10cmVlLXRvZ2dsZXItaWNvbicpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodGhpcy5zZWxlY3Rpb25Nb2RlKSB7XG4gICAgICAgICAgICBpZiAobm9kZS5zZWxlY3RhYmxlID09PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHRoaXMuaGFzRmlsdGVyZWROb2RlcygpKSB7XG4gICAgICAgICAgICAgICAgbm9kZSA9IHRoaXMuZ2V0Tm9kZVdpdGhLZXkobm9kZS5rZXksIHRoaXMudmFsdWUpO1xuXG4gICAgICAgICAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxldCBpbmRleCA9IHRoaXMuZmluZEluZGV4SW5TZWxlY3Rpb24obm9kZSk7XG4gICAgICAgICAgICBsZXQgc2VsZWN0ZWQgPSAoaW5kZXggPj0gMCk7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLmlzQ2hlY2tib3hTZWxlY3Rpb25Nb2RlKCkpIHtcbiAgICAgICAgICAgICAgICBpZiAoc2VsZWN0ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMucHJvcGFnYXRlU2VsZWN0aW9uRG93bilcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucHJvcGFnYXRlRG93bihub2RlLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2VsZWN0aW9uID0gdGhpcy5zZWxlY3Rpb24uZmlsdGVyKCh2YWwsaSkgPT4gaSE9aW5kZXgpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnByb3BhZ2F0ZVNlbGVjdGlvblVwICYmIG5vZGUucGFyZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnByb3BhZ2F0ZVVwKG5vZGUucGFyZW50LCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNlbGVjdGlvbkNoYW5nZS5lbWl0KHRoaXMuc2VsZWN0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vbk5vZGVVbnNlbGVjdC5lbWl0KHtvcmlnaW5hbEV2ZW50OiBldmVudCwgbm9kZTogbm9kZX0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMucHJvcGFnYXRlU2VsZWN0aW9uRG93bilcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucHJvcGFnYXRlRG93bihub2RlLCB0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zZWxlY3Rpb24gPSBbLi4udGhpcy5zZWxlY3Rpb258fFtdLG5vZGVdO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnByb3BhZ2F0ZVNlbGVjdGlvblVwICYmIG5vZGUucGFyZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnByb3BhZ2F0ZVVwKG5vZGUucGFyZW50LCB0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2VsZWN0aW9uQ2hhbmdlLmVtaXQodGhpcy5zZWxlY3Rpb24pO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm9uTm9kZVNlbGVjdC5lbWl0KHtvcmlnaW5hbEV2ZW50OiBldmVudCwgbm9kZTogbm9kZX0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGxldCBtZXRhU2VsZWN0aW9uID0gdGhpcy5ub2RlVG91Y2hlZCA/IGZhbHNlIDogdGhpcy5tZXRhS2V5U2VsZWN0aW9uO1xuXG4gICAgICAgICAgICAgICAgaWYgKG1ldGFTZWxlY3Rpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IG1ldGFLZXkgPSAoZXZlbnQubWV0YUtleXx8ZXZlbnQuY3RybEtleSk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHNlbGVjdGVkICYmIG1ldGFLZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmlzU2luZ2xlU2VsZWN0aW9uTW9kZSgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zZWxlY3Rpb25DaGFuZ2UuZW1pdChudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2VsZWN0aW9uID0gdGhpcy5zZWxlY3Rpb24uZmlsdGVyKCh2YWwsaSkgPT4gaSE9aW5kZXgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2VsZWN0aW9uQ2hhbmdlLmVtaXQodGhpcy5zZWxlY3Rpb24pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm9uTm9kZVVuc2VsZWN0LmVtaXQoe29yaWdpbmFsRXZlbnQ6IGV2ZW50LCBub2RlOiBub2RlfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5pc1NpbmdsZVNlbGVjdGlvbk1vZGUoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2VsZWN0aW9uQ2hhbmdlLmVtaXQobm9kZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICh0aGlzLmlzTXVsdGlwbGVTZWxlY3Rpb25Nb2RlKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNlbGVjdGlvbiA9ICghbWV0YUtleSkgPyBbXSA6IHRoaXMuc2VsZWN0aW9ufHxbXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNlbGVjdGlvbiA9IFsuLi50aGlzLnNlbGVjdGlvbixub2RlXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNlbGVjdGlvbkNoYW5nZS5lbWl0KHRoaXMuc2VsZWN0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5vbk5vZGVTZWxlY3QuZW1pdCh7b3JpZ2luYWxFdmVudDogZXZlbnQsIG5vZGU6IG5vZGV9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuaXNTaW5nbGVTZWxlY3Rpb25Nb2RlKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzZWxlY3RlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2VsZWN0aW9uID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm9uTm9kZVVuc2VsZWN0LmVtaXQoe29yaWdpbmFsRXZlbnQ6IGV2ZW50LCBub2RlOiBub2RlfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNlbGVjdGlvbiA9IG5vZGU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5vbk5vZGVTZWxlY3QuZW1pdCh7b3JpZ2luYWxFdmVudDogZXZlbnQsIG5vZGU6IG5vZGV9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzZWxlY3RlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2VsZWN0aW9uID0gdGhpcy5zZWxlY3Rpb24uZmlsdGVyKCh2YWwsaSkgPT4gaSE9aW5kZXgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMub25Ob2RlVW5zZWxlY3QuZW1pdCh7b3JpZ2luYWxFdmVudDogZXZlbnQsIG5vZGU6IG5vZGV9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2VsZWN0aW9uID0gWy4uLnRoaXMuc2VsZWN0aW9ufHxbXSxub2RlXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm9uTm9kZVNlbGVjdC5lbWl0KHtvcmlnaW5hbEV2ZW50OiBldmVudCwgbm9kZTogbm9kZX0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZWxlY3Rpb25DaGFuZ2UuZW1pdCh0aGlzLnNlbGVjdGlvbik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5ub2RlVG91Y2hlZCA9IGZhbHNlO1xuICAgIH1cblxuICAgIG9uTm9kZVRvdWNoRW5kKCkge1xuICAgICAgICB0aGlzLm5vZGVUb3VjaGVkID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBvbk5vZGVSaWdodENsaWNrKGV2ZW50OiBNb3VzZUV2ZW50LCBub2RlOiBUcmVlTm9kZSkge1xuICAgICAgICBpZiAodGhpcy5jb250ZXh0TWVudSkge1xuICAgICAgICAgICAgbGV0IGV2ZW50VGFyZ2V0ID0gKDxFbGVtZW50PiBldmVudC50YXJnZXQpO1xuXG4gICAgICAgICAgICBpZiAoZXZlbnRUYXJnZXQuY2xhc3NOYW1lICYmIGV2ZW50VGFyZ2V0LmNsYXNzTmFtZS5pbmRleE9mKCdwLXRyZWUtdG9nZ2xlcicpID09PSAwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgbGV0IGluZGV4ID0gdGhpcy5maW5kSW5kZXhJblNlbGVjdGlvbihub2RlKTtcbiAgICAgICAgICAgICAgICBsZXQgc2VsZWN0ZWQgPSAoaW5kZXggPj0gMCk7XG5cbiAgICAgICAgICAgICAgICBpZiAoIXNlbGVjdGVkKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmlzU2luZ2xlU2VsZWN0aW9uTW9kZSgpKVxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zZWxlY3Rpb25DaGFuZ2UuZW1pdChub2RlKTtcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zZWxlY3Rpb25DaGFuZ2UuZW1pdChbbm9kZV0pO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRoaXMuY29udGV4dE1lbnUuc2hvdyhldmVudCk7XG4gICAgICAgICAgICAgICAgdGhpcy5vbk5vZGVDb250ZXh0TWVudVNlbGVjdC5lbWl0KHtvcmlnaW5hbEV2ZW50OiBldmVudCwgbm9kZTogbm9kZX0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgZmluZEluZGV4SW5TZWxlY3Rpb24obm9kZTogVHJlZU5vZGUpIHtcbiAgICAgICAgbGV0IGluZGV4OiBudW1iZXIgPSAtMTtcblxuICAgICAgICBpZiAodGhpcy5zZWxlY3Rpb25Nb2RlICYmIHRoaXMuc2VsZWN0aW9uKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5pc1NpbmdsZVNlbGVjdGlvbk1vZGUoKSkge1xuICAgICAgICAgICAgICAgIGxldCBhcmVOb2Rlc0VxdWFsID0gKHRoaXMuc2VsZWN0aW9uLmtleSAmJiB0aGlzLnNlbGVjdGlvbi5rZXkgPT09IG5vZGUua2V5KSB8fCB0aGlzLnNlbGVjdGlvbiA9PSBub2RlO1xuICAgICAgICAgICAgICAgIGluZGV4ID0gYXJlTm9kZXNFcXVhbCA/IDAgOiAtIDE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBmb3IobGV0IGkgPSAwOyBpICA8IHRoaXMuc2VsZWN0aW9uLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCBzZWxlY3RlZE5vZGUgPSB0aGlzLnNlbGVjdGlvbltpXTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGFyZU5vZGVzRXF1YWwgPSAoc2VsZWN0ZWROb2RlLmtleSAmJiBzZWxlY3RlZE5vZGUua2V5ID09PSBub2RlLmtleSkgfHwgc2VsZWN0ZWROb2RlID09IG5vZGU7XG4gICAgICAgICAgICAgICAgICAgIGlmIChhcmVOb2Rlc0VxdWFsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbmRleCA9IGk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBpbmRleDtcbiAgICB9XG5cbiAgICBzeW5jTm9kZU9wdGlvbihub2RlLCBwYXJlbnROb2Rlcywgb3B0aW9uLCB2YWx1ZT86IGFueSkge1xuICAgICAgICAvLyB0byBzeW5jaHJvbml6ZSB0aGUgbm9kZSBvcHRpb24gYmV0d2VlbiB0aGUgZmlsdGVyZWQgbm9kZXMgYW5kIHRoZSBvcmlnaW5hbCBub2Rlcyh0aGlzLnZhbHVlKVxuICAgICAgICBjb25zdCBfbm9kZSA9IHRoaXMuaGFzRmlsdGVyZWROb2RlcygpID8gdGhpcy5nZXROb2RlV2l0aEtleShub2RlLmtleSwgcGFyZW50Tm9kZXMpIDogbnVsbDtcbiAgICAgICAgaWYgKF9ub2RlKSB7XG4gICAgICAgICAgICBfbm9kZVtvcHRpb25dID0gdmFsdWV8fG5vZGVbb3B0aW9uXTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGhhc0ZpbHRlcmVkTm9kZXMoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmZpbHRlciAmJiB0aGlzLmZpbHRlcmVkTm9kZXMgJiYgdGhpcy5maWx0ZXJlZE5vZGVzLmxlbmd0aDtcbiAgICB9XG5cbiAgICBnZXROb2RlV2l0aEtleShrZXk6IHN0cmluZywgbm9kZXM6IFRyZWVOb2RlW10pIHtcbiAgICAgICAgZm9yIChsZXQgbm9kZSBvZiBub2Rlcykge1xuICAgICAgICAgICAgaWYgKG5vZGUua2V5ID09PSBrZXkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbm9kZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKG5vZGUuY2hpbGRyZW4pIHtcbiAgICAgICAgICAgICAgICBsZXQgbWF0Y2hlZE5vZGUgPSB0aGlzLmdldE5vZGVXaXRoS2V5KGtleSwgbm9kZS5jaGlsZHJlbik7XG4gICAgICAgICAgICAgICAgaWYgKG1hdGNoZWROb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBtYXRjaGVkTm9kZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcm9wYWdhdGVVcChub2RlOiBUcmVlTm9kZSwgc2VsZWN0OiBib29sZWFuKSB7XG4gICAgICAgIGlmIChub2RlLmNoaWxkcmVuICYmIG5vZGUuY2hpbGRyZW4ubGVuZ3RoKSB7XG4gICAgICAgICAgICBsZXQgc2VsZWN0ZWRDb3VudDogbnVtYmVyID0gMDtcbiAgICAgICAgICAgIGxldCBjaGlsZFBhcnRpYWxTZWxlY3RlZDogYm9vbGVhbiA9IGZhbHNlO1xuICAgICAgICAgICAgZm9yKGxldCBjaGlsZCBvZiBub2RlLmNoaWxkcmVuKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuaXNTZWxlY3RlZChjaGlsZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0ZWRDb3VudCsrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChjaGlsZC5wYXJ0aWFsU2VsZWN0ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgY2hpbGRQYXJ0aWFsU2VsZWN0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHNlbGVjdCAmJiBzZWxlY3RlZENvdW50ID09IG5vZGUuY2hpbGRyZW4ubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zZWxlY3Rpb24gPSBbLi4udGhpcy5zZWxlY3Rpb258fFtdLG5vZGVdO1xuICAgICAgICAgICAgICAgIG5vZGUucGFydGlhbFNlbGVjdGVkID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoIXNlbGVjdCkge1xuICAgICAgICAgICAgICAgICAgICBsZXQgaW5kZXggPSB0aGlzLmZpbmRJbmRleEluU2VsZWN0aW9uKG5vZGUpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoaW5kZXggPj0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zZWxlY3Rpb24gPSB0aGlzLnNlbGVjdGlvbi5maWx0ZXIoKHZhbCxpKSA9PiBpIT1pbmRleCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoY2hpbGRQYXJ0aWFsU2VsZWN0ZWQgfHwgc2VsZWN0ZWRDb3VudCA+IDAgJiYgc2VsZWN0ZWRDb3VudCAhPSBub2RlLmNoaWxkcmVuLmxlbmd0aClcbiAgICAgICAgICAgICAgICAgICAgbm9kZS5wYXJ0aWFsU2VsZWN0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgbm9kZS5wYXJ0aWFsU2VsZWN0ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5zeW5jTm9kZU9wdGlvbihub2RlLCB0aGlzLmZpbHRlcmVkTm9kZXMsICdwYXJ0aWFsU2VsZWN0ZWQnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBwYXJlbnQgPSBub2RlLnBhcmVudDtcbiAgICAgICAgaWYgKHBhcmVudCkge1xuICAgICAgICAgICAgdGhpcy5wcm9wYWdhdGVVcChwYXJlbnQsIHNlbGVjdCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcm9wYWdhdGVEb3duKG5vZGU6IFRyZWVOb2RlLCBzZWxlY3Q6IGJvb2xlYW4pIHtcbiAgICAgICAgbGV0IGluZGV4ID0gdGhpcy5maW5kSW5kZXhJblNlbGVjdGlvbihub2RlKTtcblxuICAgICAgICBpZiAoc2VsZWN0ICYmIGluZGV4ID09IC0xKSB7XG4gICAgICAgICAgICB0aGlzLnNlbGVjdGlvbiA9IFsuLi50aGlzLnNlbGVjdGlvbnx8W10sbm9kZV07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoIXNlbGVjdCAmJiBpbmRleCA+IC0xKSB7XG4gICAgICAgICAgICB0aGlzLnNlbGVjdGlvbiA9IHRoaXMuc2VsZWN0aW9uLmZpbHRlcigodmFsLGkpID0+IGkhPWluZGV4KTtcbiAgICAgICAgfVxuXG4gICAgICAgIG5vZGUucGFydGlhbFNlbGVjdGVkID0gZmFsc2U7XG5cbiAgICAgICAgdGhpcy5zeW5jTm9kZU9wdGlvbihub2RlLCB0aGlzLmZpbHRlcmVkTm9kZXMsICdwYXJ0aWFsU2VsZWN0ZWQnKTtcblxuICAgICAgICBpZiAobm9kZS5jaGlsZHJlbiAmJiBub2RlLmNoaWxkcmVuLmxlbmd0aCkge1xuICAgICAgICAgICAgZm9yKGxldCBjaGlsZCBvZiBub2RlLmNoaWxkcmVuKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wcm9wYWdhdGVEb3duKGNoaWxkLCBzZWxlY3QpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgaXNTZWxlY3RlZChub2RlOiBUcmVlTm9kZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5maW5kSW5kZXhJblNlbGVjdGlvbihub2RlKSAhPSAtMTtcbiAgICB9XG5cbiAgICBpc1NpbmdsZVNlbGVjdGlvbk1vZGUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnNlbGVjdGlvbk1vZGUgJiYgdGhpcy5zZWxlY3Rpb25Nb2RlID09ICdzaW5nbGUnO1xuICAgIH1cblxuICAgIGlzTXVsdGlwbGVTZWxlY3Rpb25Nb2RlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zZWxlY3Rpb25Nb2RlICYmIHRoaXMuc2VsZWN0aW9uTW9kZSA9PSAnbXVsdGlwbGUnO1xuICAgIH1cblxuICAgIGlzQ2hlY2tib3hTZWxlY3Rpb25Nb2RlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zZWxlY3Rpb25Nb2RlICYmIHRoaXMuc2VsZWN0aW9uTW9kZSA9PSAnY2hlY2tib3gnO1xuICAgIH1cblxuICAgIGlzTm9kZUxlYWYobm9kZSkge1xuICAgICAgICByZXR1cm4gbm9kZS5sZWFmID09IGZhbHNlID8gZmFsc2UgOiAhKG5vZGUuY2hpbGRyZW4gJiYgbm9kZS5jaGlsZHJlbi5sZW5ndGgpO1xuICAgIH1cblxuICAgIGdldFJvb3ROb2RlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5maWx0ZXJlZE5vZGVzID8gdGhpcy5maWx0ZXJlZE5vZGVzIDogdGhpcy52YWx1ZTtcbiAgICB9XG5cbiAgICBnZXRUZW1wbGF0ZUZvck5vZGUobm9kZTogVHJlZU5vZGUpOiBUZW1wbGF0ZVJlZjxhbnk+IHtcbiAgICAgICAgaWYgKHRoaXMudGVtcGxhdGVNYXApXG4gICAgICAgICAgICByZXR1cm4gbm9kZS50eXBlID8gKHRoaXMudGVtcGxhdGVNYXBbbm9kZS50eXBlXSA/IHRoaXMudGVtcGxhdGVNYXBbbm9kZS50eXBlXSA6IHRoaXMudGVtcGxhdGVNYXBbJ2RlZmF1bHQnXSkgOiB0aGlzLnRlbXBsYXRlTWFwWydkZWZhdWx0J107XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIG9uRHJhZ092ZXIoZXZlbnQpIHtcbiAgICAgICAgaWYgKHRoaXMuZHJvcHBhYmxlTm9kZXMgJiYgKCF0aGlzLnZhbHVlIHx8IHRoaXMudmFsdWUubGVuZ3RoID09PSAwKSkge1xuICAgICAgICAgICAgZXZlbnQuZGF0YVRyYW5zZmVyLmRyb3BFZmZlY3QgPSAnbW92ZSc7XG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgb25Ecm9wKGV2ZW50KSB7XG4gICAgICAgIGlmICh0aGlzLmRyb3BwYWJsZU5vZGVzICYmICghdGhpcy52YWx1ZSB8fCB0aGlzLnZhbHVlLmxlbmd0aCA9PT0gMCkpIHtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBsZXQgZHJhZ05vZGUgPSB0aGlzLmRyYWdOb2RlO1xuICAgICAgICAgICAgaWYodGhpcy5hbGxvd0Ryb3AoZHJhZ05vZGUsIG51bGwsIHRoaXMuZHJhZ05vZGVTY29wZSwgRHJvcFR5cGUuQm90aCkpIHtcbiAgICAgICAgICAgICAgICBsZXQgZHJhZ05vZGVJbmRleCA9IHRoaXMuZHJhZ05vZGVJbmRleDtcbiAgICAgICAgICAgICAgICB0aGlzLmRyYWdOb2RlU3ViTm9kZXMuc3BsaWNlKGRyYWdOb2RlSW5kZXgsIDEpO1xuICAgICAgICAgICAgICAgIHRoaXMudmFsdWUgPSB0aGlzLnZhbHVlfHxbXTtcbiAgICAgICAgICAgICAgICB0aGlzLnZhbHVlLnB1c2goZHJhZ05vZGUpO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5kcmFnRHJvcFNlcnZpY2Uuc3RvcERyYWcoe1xuICAgICAgICAgICAgICAgICAgICBub2RlOiBkcmFnTm9kZVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgb25EcmFnRW50ZXIoZXZlbnQpIHtcbiAgICAgICAgaWYgKHRoaXMuZHJvcHBhYmxlTm9kZXMgJiYgdGhpcy5hbGxvd0Ryb3AodGhpcy5kcmFnTm9kZSwgbnVsbCwgdGhpcy5kcmFnTm9kZVNjb3BlLCBEcm9wVHlwZS5Cb3RoKSkge1xuICAgICAgICAgICAgdGhpcy5kcmFnSG92ZXIgPSB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgb25EcmFnTGVhdmUoZXZlbnQpIHtcbiAgICAgICAgaWYgKHRoaXMuZHJvcHBhYmxlTm9kZXMpIHtcbiAgICAgICAgICAgIGxldCByZWN0ID0gZXZlbnQuY3VycmVudFRhcmdldC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgICAgIGlmIChldmVudC54ID4gcmVjdC5sZWZ0ICsgcmVjdC53aWR0aCB8fCBldmVudC54IDwgcmVjdC5sZWZ0IHx8IGV2ZW50LnkgPiByZWN0LnRvcCArIHJlY3QuaGVpZ2h0IHx8IGV2ZW50LnkgPCByZWN0LnRvcCkge1xuICAgICAgICAgICAgICAgdGhpcy5kcmFnSG92ZXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFsbG93RHJvcChkcmFnTm9kZTogVHJlZU5vZGUsIGRyb3BOb2RlOiBUcmVlTm9kZSwgZHJhZ05vZGVTY29wZTogYW55LCBkcm9wVHlwZTogRHJvcFR5cGUpOiBib29sZWFuIHtcbiAgICAgICAgaWYoIWRyYWdOb2RlKSB7XG4gICAgICAgICAgICAvL3ByZXZlbnQgcmFuZG9tIGh0bWwgZWxlbWVudHMgdG8gYmUgZHJhZ2dlZFxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHRoaXMuaXNWYWxpZERyYWdTY29wZShkcmFnTm9kZVNjb3BlKSkge1xuICAgICAgICAgICAgbGV0IGFsbG93OiBib29sZWFuID0gdHJ1ZTtcbiAgICAgICAgICAgIGlmIChkcm9wTm9kZSkge1xuICAgICAgICAgICAgICAgIGlmIChkcmFnTm9kZSA9PT0gZHJvcE5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgYWxsb3cgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCBwYXJlbnQgPSBkcm9wTm9kZS5wYXJlbnQ7XG4gICAgICAgICAgICAgICAgICAgIHdoaWxlKHBhcmVudCAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocGFyZW50ID09PSBkcmFnTm9kZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFsbG93ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJlbnQgPSBwYXJlbnQucGFyZW50O1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGFsbG93KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBldmFsdWF0ZURyb3BTY29wZSA9IChkcm9wU2NvcGU6IGFueSwgZHJhZ1Njb3BlOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGRyb3BTY29wZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBkcmFnU2NvcGUgPT09ICdzdHJpbmcnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWxsb3cgPSBkcm9wU2NvcGUgPT09IGRyYWdTY29wZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoZHJhZ1Njb3BlIGluc3RhbmNlb2YgQXJyYXkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbGxvdyA9ICg8QXJyYXk8YW55Pj5kcmFnU2NvcGUpLmluZGV4T2YoZHJvcFNjb3BlKSAhPSAtMTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoZHJvcFNjb3BlIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBkcmFnU2NvcGUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbGxvdyA9ICg8QXJyYXk8YW55Pj5kcm9wU2NvcGUpLmluZGV4T2YoZHJhZ1Njb3BlKSAhPSAtMTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChkcmFnU2NvcGUgaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgcyBvZiBkcm9wU2NvcGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBkcyBvZiBkcmFnU2NvcGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHMgPT09IGRzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbGxvdyA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkcm9wVHlwZSA9PT0gRHJvcFR5cGUuTm9kZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV2YWx1YXRlRHJvcFNjb3BlKGRyb3BOb2RlLmRyb3BTY29wZSwgZHJhZ05vZGUuZHJhZ1Njb3BlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZHJvcFR5cGUgPT09IERyb3BUeXBlLkRyb3BQb2ludCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV2YWx1YXRlRHJvcFNjb3BlKGRyb3BOb2RlLmRyb3BQb2ludFNjb3BlLCBkcmFnTm9kZS5kcmFnU2NvcGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChkcm9wVHlwZSA9PT0gRHJvcFR5cGUuQm90aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV2YWx1YXRlRHJvcFNjb3BlKGRyb3BOb2RlLmRyb3BTY29wZSwgZHJhZ05vZGUuZHJhZ1Njb3BlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBldmFsdWF0ZURyb3BTY29wZShkcm9wTm9kZS5kcm9wUG9pbnRTY29wZSwgZHJhZ05vZGUuZHJhZ1Njb3BlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGFsbG93O1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaXNWYWxpZERyYWdTY29wZShkcmFnU2NvcGU6IGFueSk6IGJvb2xlYW4ge1xuICAgICAgICBsZXQgZHJvcFNjb3BlID0gdGhpcy5kcm9wcGFibGVTY29wZTtcblxuICAgICAgICBpZiAoZHJvcFNjb3BlKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGRyb3BTY29wZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGRyYWdTY29wZSA9PT0gJ3N0cmluZycpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkcm9wU2NvcGUgPT09IGRyYWdTY29wZTtcbiAgICAgICAgICAgICAgICBlbHNlIGlmIChkcmFnU2NvcGUgaW5zdGFuY2VvZiBBcnJheSlcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICg8QXJyYXk8YW55Pj5kcmFnU2NvcGUpLmluZGV4T2YoZHJvcFNjb3BlKSAhPSAtMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGRyb3BTY29wZSBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBkcmFnU2NvcGUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAoPEFycmF5PGFueT4+ZHJvcFNjb3BlKS5pbmRleE9mKGRyYWdTY29wZSkgIT0gLTE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGRyYWdTY29wZSBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgICAgICAgICAgICAgIGZvcihsZXQgcyBvZiBkcm9wU2NvcGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvcihsZXQgZHMgb2YgZHJhZ1Njb3BlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHMgPT09IGRzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX2ZpbHRlcihldmVudCkge1xuICAgICAgICBsZXQgZmlsdGVyVmFsdWUgPSBldmVudC50YXJnZXQudmFsdWU7XG4gICAgICAgIGlmIChmaWx0ZXJWYWx1ZSA9PT0gJycpIHtcbiAgICAgICAgICAgIHRoaXMuZmlsdGVyZWROb2RlcyA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmZpbHRlcmVkTm9kZXMgPSBbXTtcbiAgICAgICAgICAgIGNvbnN0IHNlYXJjaEZpZWxkczogc3RyaW5nW10gPSB0aGlzLmZpbHRlckJ5LnNwbGl0KCcsJyk7XG4gICAgICAgICAgICBjb25zdCBmaWx0ZXJUZXh0ID0gT2JqZWN0VXRpbHMucmVtb3ZlQWNjZW50cyhmaWx0ZXJWYWx1ZSkudG9Mb2NhbGVMb3dlckNhc2UodGhpcy5maWx0ZXJMb2NhbGUpO1xuICAgICAgICAgICAgY29uc3QgaXNTdHJpY3RNb2RlID0gdGhpcy5maWx0ZXJNb2RlID09PSAnc3RyaWN0JztcbiAgICAgICAgICAgIGZvcihsZXQgbm9kZSBvZiB0aGlzLnZhbHVlKSB7XG4gICAgICAgICAgICAgICAgbGV0IGNvcHlOb2RlID0gey4uLm5vZGV9O1xuICAgICAgICAgICAgICAgIGxldCBwYXJhbXNXaXRob3V0Tm9kZSA9IHtzZWFyY2hGaWVsZHMsIGZpbHRlclRleHQsIGlzU3RyaWN0TW9kZX07XG4gICAgICAgICAgICAgICAgaWYgKChpc1N0cmljdE1vZGUgJiYgKHRoaXMuZmluZEZpbHRlcmVkTm9kZXMoY29weU5vZGUsIHBhcmFtc1dpdGhvdXROb2RlKSB8fCB0aGlzLmlzRmlsdGVyTWF0Y2hlZChjb3B5Tm9kZSwgcGFyYW1zV2l0aG91dE5vZGUpKSkgfHxcbiAgICAgICAgICAgICAgICAgICAgKCFpc1N0cmljdE1vZGUgJiYgKHRoaXMuaXNGaWx0ZXJNYXRjaGVkKGNvcHlOb2RlLCBwYXJhbXNXaXRob3V0Tm9kZSkgfHwgdGhpcy5maW5kRmlsdGVyZWROb2Rlcyhjb3B5Tm9kZSwgcGFyYW1zV2l0aG91dE5vZGUpKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5maWx0ZXJlZE5vZGVzLnB1c2goY29weU5vZGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMudXBkYXRlU2VyaWFsaXplZFZhbHVlKCk7XG4gICAgICAgIHRoaXMub25GaWx0ZXIuZW1pdCh7XG4gICAgICAgICAgICBmaWx0ZXI6IGZpbHRlclZhbHVlLFxuICAgICAgICAgICAgZmlsdGVyZWRWYWx1ZTogdGhpcy5maWx0ZXJlZE5vZGVzXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZpbmRGaWx0ZXJlZE5vZGVzKG5vZGUsIHBhcmFtc1dpdGhvdXROb2RlKSB7XG4gICAgICAgIGlmIChub2RlKSB7XG4gICAgICAgICAgICBsZXQgbWF0Y2hlZCA9IGZhbHNlO1xuICAgICAgICAgICAgaWYgKG5vZGUuY2hpbGRyZW4pIHtcbiAgICAgICAgICAgICAgICBsZXQgY2hpbGROb2RlcyA9IFsuLi5ub2RlLmNoaWxkcmVuXTtcbiAgICAgICAgICAgICAgICBub2RlLmNoaWxkcmVuID0gW107XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgY2hpbGROb2RlIG9mIGNoaWxkTm9kZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGNvcHlDaGlsZE5vZGUgPSB7Li4uY2hpbGROb2RlfTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuaXNGaWx0ZXJNYXRjaGVkKGNvcHlDaGlsZE5vZGUsIHBhcmFtc1dpdGhvdXROb2RlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWF0Y2hlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlLmNoaWxkcmVuLnB1c2goY29weUNoaWxkTm9kZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChtYXRjaGVkKSB7XG4gICAgICAgICAgICAgICAgbm9kZS5leHBhbmRlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpc0ZpbHRlck1hdGNoZWQobm9kZSwge3NlYXJjaEZpZWxkcywgZmlsdGVyVGV4dCwgaXNTdHJpY3RNb2RlfSkge1xuICAgICAgICBsZXQgbWF0Y2hlZCA9IGZhbHNlO1xuICAgICAgICBmb3IobGV0IGZpZWxkIG9mIHNlYXJjaEZpZWxkcykge1xuICAgICAgICAgICAgbGV0IGZpZWxkVmFsdWUgPSBPYmplY3RVdGlscy5yZW1vdmVBY2NlbnRzKFN0cmluZyhPYmplY3RVdGlscy5yZXNvbHZlRmllbGREYXRhKG5vZGUsIGZpZWxkKSkpLnRvTG9jYWxlTG93ZXJDYXNlKHRoaXMuZmlsdGVyTG9jYWxlKTtcbiAgICAgICAgICAgIGlmIChmaWVsZFZhbHVlLmluZGV4T2YoZmlsdGVyVGV4dCkgPiAtMSkge1xuICAgICAgICAgICAgICAgIG1hdGNoZWQgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFtYXRjaGVkIHx8IChpc1N0cmljdE1vZGUgJiYgIXRoaXMuaXNOb2RlTGVhZihub2RlKSkpIHtcbiAgICAgICAgICAgIG1hdGNoZWQgPSB0aGlzLmZpbmRGaWx0ZXJlZE5vZGVzKG5vZGUsIHtzZWFyY2hGaWVsZHMsIGZpbHRlclRleHQsIGlzU3RyaWN0TW9kZX0pIHx8IG1hdGNoZWQ7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbWF0Y2hlZDtcbiAgICB9XG5cbiAgICBnZXRCbG9ja2FibGVFbGVtZW50KCk6IEhUTUxFbGVtZW50wqB7XG4gICAgICByZXR1cm4gdGhpcy5lbC5uYXRpdmVFbGVtZW50LmNoaWxkcmVuWzBdO1xuICAgIH1cblxuICAgIG5nT25EZXN0cm95KCkge1xuICAgICAgICBpZiAodGhpcy5kcmFnU3RhcnRTdWJzY3JpcHRpb24pIHtcbiAgICAgICAgICAgIHRoaXMuZHJhZ1N0YXJ0U3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5kcmFnU3RvcFN1YnNjcmlwdGlvbikge1xuICAgICAgICAgICAgdGhpcy5kcmFnU3RvcFN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgICAgICB9XG4gICAgfVxufVxuZXhwb3J0IGVudW0gRHJvcFR5cGUge1xuICAgIEJvdGgsXG4gICAgRHJvcFBvaW50LFxuICAgIE5vZGVcbn1cbkBOZ01vZHVsZSh7XG4gICAgaW1wb3J0czogW0NvbW1vbk1vZHVsZSxTY3JvbGxpbmdNb2R1bGUsUmlwcGxlTW9kdWxlXSxcbiAgICBleHBvcnRzOiBbVHJlZSxTaGFyZWRNb2R1bGUsU2Nyb2xsaW5nTW9kdWxlXSxcbiAgICBkZWNsYXJhdGlvbnM6IFtUcmVlLFVJVHJlZU5vZGVdXG59KVxuZXhwb3J0IGNsYXNzIFRyZWVNb2R1bGUgeyB9XG4iXX0=